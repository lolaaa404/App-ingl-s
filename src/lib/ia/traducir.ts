import 'server-only';

import { generateText, Output } from 'ai';
import { esquemaTraduccion } from './esquemas';
import { bloqueDiccionarios, bloqueMemoria, sistemaTraduccion, usuarioTraduccion } from './prompts';
import { exigirClave, mensajeDeError, modeloPara } from './modelo';
import { anotarSinEquivalente, detectarSinEquivalente, entradasAplicables, verificarGlosario } from '../glosario/deteccion';
import { buscarCoincidencias, coincidenciaPerfecta, construirIndice } from '../memoria/coincidencias';
import { reglasPara } from '../referencias/calcos';
import { id, truncar } from '../utiles';
import type {
  Anotacion,
  Diccionario,
  EntradaGlosario,
  EntradaMemoria,
  EstiloTraduccion,
  Glosario,
  Idioma,
  Justificacion,
  Proyecto,
  Segmento,
} from '../tipos';

/** Tamaño de lote: suficiente contexto sin desbordar la ventana ni la latencia. */
const SEGMENTOS_POR_LOTE = 12;
const CARACTERES_POR_LOTE = 6000;
const CONTEXTO_PREVIO = 3;
const CONTEXTO_POSTERIOR = 2;

export interface ProgresoTraduccion {
  hechos: number;
  total: number;
  lote: number;
  totalLotes: number;
  aviso?: string;
}

export interface ResultadoTraduccion {
  segmentos: Segmento[];
  avisos: string[];
  /** Equivalencias fijadas durante la traducción, para el glosario del encargo. */
  terminologia: { origen: string; destino: string }[];
}

/** Agrupa los segmentos en lotes por cantidad y por volumen de texto. */
function armarLotes(segmentos: Segmento[]): Segmento[][] {
  const lotes: Segmento[][] = [];
  let actual: Segmento[] = [];
  let caracteres = 0;

  for (const s of segmentos) {
    if (
      actual.length > 0 &&
      (actual.length >= SEGMENTOS_POR_LOTE || caracteres + s.origen.length > CARACTERES_POR_LOTE)
    ) {
      lotes.push(actual);
      actual = [];
      caracteres = 0;
    }
    actual.push(s);
    caracteres += s.origen.length;
  }

  if (actual.length) lotes.push(actual);
  return lotes;
}

/** Anotaciones que salen de las reglas léxicas aplicadas a la traducción. */
function anotarCalcos(destino: string, idiomaDestino: Idioma): Anotacion[] {
  const salida: Anotacion[] = [];

  for (const regla of reglasPara(idiomaDestino)) {
    const re = new RegExp(regla.patron, 'giu');
    const m = re.exec(destino);
    if (!m) continue;

    salida.push({
      id: id('an'),
      etiqueta: regla.etiqueta,
      ambito: 'destino',
      fragmento: m[0],
      motivo: regla.mensaje,
      sugerencia: regla.sugerencia,
      severidad: regla.severidad,
      fuente: 'regla',
    });
  }

  return salida;
}

/** Quita anotaciones repetidas sobre el mismo fragmento y etiqueta. */
function deduplicar(anotaciones: Anotacion[]): Anotacion[] {
  const vistas = new Set<string>();
  const salida: Anotacion[] = [];

  for (const a of anotaciones) {
    const clave = `${a.etiqueta}|${a.ambito}|${a.fragmento.toLowerCase()}`;
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    salida.push(a);
  }

  return salida;
}

export async function traducirSegmentos(opciones: {
  proyecto: Proyecto;
  estilo: EstiloTraduccion;
  glosarios: Glosario[];
  diccionarios: Diccionario[];
  memoria: EntradaMemoria[];
  /** Índices de los segmentos a traducir; por defecto, los pendientes. */
  indices?: number[];
  /** Reutiliza las coincidencias del 100 % sin pasar por el modelo. */
  aprovecharMemoria?: boolean;
  onProgreso?: (p: ProgresoTraduccion) => void;
}): Promise<ResultadoTraduccion> {
  exigirClave();

  const { proyecto, estilo, glosarios, diccionarios, memoria } = opciones;
  const aprovecharMemoria = opciones.aprovecharMemoria ?? true;
  const avisos: string[] = [];

  const segmentos = proyecto.segmentos.map((s) => ({ ...s }));
  const seleccion = opciones.indices?.length
    ? opciones.indices.map((i) => segmentos[i]).filter(Boolean)
    : segmentos.filter((s) => s.estado === 'pendiente');

  if (!seleccion.length) {
    return { segmentos, avisos: ['No hay segmentos pendientes de traducir.'], terminologia: [] };
  }

  /* --- Memoria de traducción --------------------------------------- */

  const indice = construirIndice(memoria, proyecto.idiomaOrigen, proyecto.idiomaDestino);
  const pendientes: Segmento[] = [];

  for (const s of seleccion) {
    s.coincidencias = buscarCoincidencias(s.origen, indice);
    const exacta = aprovecharMemoria ? coincidenciaPerfecta(s.coincidencias) : undefined;

    if (exacta) {
      s.destino = exacta.destino;
      s.propuesta = exacta.destino;
      s.estado = 'traducido';
      s.desdeMemoria = true;
      s.anotaciones = deduplicar([
        ...anotarCalcos(s.destino, proyecto.idiomaDestino),
        {
          id: id('an'),
          etiqueta: 'revisar-contexto',
          ambito: 'destino',
          fragmento: truncar(s.destino, 80),
          motivo:
            'Reutilizado tal cual desde la memoria de traducción (coincidencia del 100 %). Conviene confirmar que encaja en este contexto.',
          severidad: 'baja',
          fuente: 'memoria',
        },
      ]);
    } else {
      s.desdeMemoria = false;
      pendientes.push(s);
    }
  }

  if (!pendientes.length) {
    return {
      segmentos,
      avisos: [`Los ${seleccion.length} segmentos se resolvieron con la memoria de traducción.`],
      terminologia: [],
    };
  }

  /* --- Traducción por lotes ---------------------------------------- */

  const lotes = armarLotes(pendientes);
  const terminologiaFijada: { origen: string; destino: string }[] = [];
  const vistaTerminologia = new Set<string>();
  let hechos = seleccion.length - pendientes.length;

  for (const [numeroLote, lote] of lotes.entries()) {
    const textoDelLote = lote.map((s) => s.origen).join('\n');
    const entradasGlosario = entradasAplicables(textoDelLote, glosarios, proyecto.idiomaOrigen);
    const sinEquivalente = detectarSinEquivalente(textoDelLote, proyecto.idiomaOrigen);

    const primerIndice = lote[0].indice;
    const ultimoIndice = lote[lote.length - 1].indice;

    const contextoPrevio = segmentos
      .slice(Math.max(0, primerIndice - CONTEXTO_PREVIO), primerIndice)
      .filter((s) => s.destino.trim())
      .map((s) => ({ origen: s.origen, destino: s.destino }));

    const contextoPosterior = segmentos
      .slice(ultimoIndice + 1, ultimoIndice + 1 + CONTEXTO_POSTERIOR)
      .map((s) => s.origen);

    const sistema = sistemaTraduccion({
      idiomaOrigen: proyecto.idiomaOrigen,
      idiomaDestino: proyecto.idiomaDestino,
      estilo,
      analisis: proyecto.analisis,
      glosarios,
      diccionarios,
      sinEquivalente,
      entradasGlosario,
      terminologiaFijada,
    });

    const usuario = usuarioTraduccion({
      segmentos: lote,
      contextoPrevio,
      contextoPosterior,
      memoria: bloqueMemoria(lote),
      diccionarios: bloqueDiccionarios(diccionarios, textoDelLote),
    });

    try {
      const { output } = await generateText({
        model: modeloPara('traduccion'),
        output: Output.object({ schema: esquemaTraduccion }),
        system: sistema,
        prompt: usuario,
      });

      const porId = new Map(output.segmentos.map((r) => [r.id, r]));

      for (const s of lote) {
        const resultado = porId.get(s.id);
        if (!resultado) {
          avisos.push(
            `El modelo no devolvió el segmento ${s.indice + 1}; quedó pendiente para reintentar.`,
          );
          continue;
        }

        s.destino = resultado.traduccion;
        s.propuesta = resultado.traduccion;
        s.estado = 'traducido';

        const delModelo: Anotacion[] = resultado.anotaciones.map((a) => ({
          id: id('an'),
          etiqueta: a.etiqueta,
          ambito: a.ambito,
          fragmento: a.fragmento,
          motivo: a.motivo,
          opciones: a.opciones.length ? a.opciones : undefined,
          sugerencia: a.sugerencia || undefined,
          severidad: a.severidad,
          fuente: 'ia',
        }));

        s.anotaciones = deduplicar([
          ...delModelo,
          ...verificarGlosario(s, entradasGlosario),
          ...anotarSinEquivalente(s, sinEquivalente),
          ...anotarCalcos(s.destino, proyecto.idiomaDestino),
        ]);

        s.justificaciones = resultado.justificaciones.map(
          (j): Justificacion => ({
            termino: j.termino,
            eleccion: j.eleccion,
            razonamiento: j.razonamiento,
            fuentes: j.fuentes.map((f) => ({
              titulo: f.titulo,
              tipo: f.tipo,
              referencia: f.referencia || undefined,
            })),
            alternativas: j.alternativas.length ? j.alternativas : undefined,
          }),
        );

        for (const j of s.justificaciones) {
          const clave = j.termino.toLowerCase().trim();
          if (clave && !vistaTerminologia.has(clave)) {
            vistaTerminologia.add(clave);
            terminologiaFijada.push({ origen: j.termino, destino: j.eleccion });
          }
        }

        hechos++;
      }
    } catch (error) {
      const mensaje = mensajeDeError(error);
      avisos.push(
        `Falló el lote ${numeroLote + 1} de ${lotes.length} (segmentos ${lote[0].indice + 1} a ${lote[lote.length - 1].indice + 1}): ${mensaje}`,
      );
      opciones.onProgreso?.({
        hechos,
        total: seleccion.length,
        lote: numeroLote + 1,
        totalLotes: lotes.length,
        aviso: mensaje,
      });
      continue;
    }

    opciones.onProgreso?.({
      hechos,
      total: seleccion.length,
      lote: numeroLote + 1,
      totalLotes: lotes.length,
    });
  }

  return { segmentos, avisos, terminologia: terminologiaFijada };
}

/** Entradas de glosario que se pueden proponer a partir de lo traducido. */
export function glosarioPropuesto(
  segmentos: Segmento[],
  idiomaOrigen: Idioma,
): EntradaGlosario[] {
  const vistas = new Set<string>();
  const salida: EntradaGlosario[] = [];

  for (const s of segmentos) {
    for (const j of s.justificaciones) {
      const clave = j.termino.toLowerCase().trim();
      if (!clave || vistas.has(clave)) continue;
      vistas.add(clave);

      salida.push({
        id: id('gl'),
        origen: j.termino,
        destino: j.eleccion,
        idiomaOrigen,
        definicion: j.razonamiento,
        prohibidos: (j.alternativas ?? []).map((a) => a.opcion),
        sensibleContexto: false,
        sinEquivalente: s.anotaciones.some((a) => a.etiqueta === 'sin-equivalente-exacto'),
        notas: j.razonamiento,
        fuentes: j.fuentes.map((f) => `${f.titulo}${f.referencia ? `, ${f.referencia}` : ''}`),
      });
    }
  }

  return salida;
}
