import { reglasPara } from '../referencias/calcos';
import { verificarGlosario } from '../glosario/deteccion';
import { medirEstilo } from './estilo';
import { extraerFechas, extraerMarcadores, extraerNumeros, faltantes } from './numeros';
import { id, normalizar, normalizarSuave, truncar } from '../utiles';
import type {
  EntradaGlosario,
  EstiloTraduccion,
  Hallazgo,
  Idioma,
  Proyecto,
  Segmento,
} from '../tipos';

/**
 * Control de calidad por reglas: todo lo que se puede comprobar sin modelo.
 * Es determinista, instantáneo y no cuesta nada, así que se ejecuta siempre;
 * el control con IA se añade encima para lo que exige leer y entender.
 */

function hallazgo(datos: Omit<Hallazgo, 'id' | 'origen'>): Hallazgo {
  return { ...datos, id: id('hz'), origen: 'regla' };
}

/** Un segmento sin contenido traducible: una cifra suelta, un código. */
function esNoTraducible(texto: string): boolean {
  return !/\p{L}{2,}/u.test(texto);
}

/* ------------------------------------------------------------------ */
/* Controles por segmento                                              */
/* ------------------------------------------------------------------ */

function controlarOmisiones(s: Segmento): Hallazgo[] {
  const salida: Hallazgo[] = [];

  if (!s.destino.trim()) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'omision',
        etiqueta: 'omision',
        severidad: 'alta',
        mensaje: 'Segmento sin traducir.',
        fragmento: truncar(s.origen, 160),
      }),
    );
    return salida;
  }

  if (
    normalizarSuave(s.destino) === normalizarSuave(s.origen) &&
    !esNoTraducible(s.origen) &&
    s.origen.split(/\s+/).length > 2
  ) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'omision',
        etiqueta: 'omision',
        severidad: 'alta',
        mensaje: 'La traducción es idéntica al original.',
        detalle:
          'Puede ser correcto si se trata de un nombre propio o de una cita que no se traduce; si no, el segmento quedó sin traducir.',
        fragmento: truncar(s.origen, 160),
      }),
    );
  }

  // Una traducción mucho más corta que el original suele ser una omisión.
  const palabrasOrigen = s.origen.split(/\s+/).length;
  const palabrasDestino = s.destino.split(/\s+/).length;
  if (palabrasOrigen >= 12 && palabrasDestino < palabrasOrigen * 0.5) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'omision',
        etiqueta: 'omision',
        severidad: 'media',
        mensaje: `La traducción tiene menos de la mitad de palabras que el original (${palabrasDestino} frente a ${palabrasOrigen}).`,
        detalle: 'Conviene comprobar que no falte contenido.',
        fragmento: truncar(s.destino, 160),
      }),
    );
  }

  return salida;
}

function controlarNumeros(s: Segmento): Hallazgo[] {
  if (!s.destino.trim()) return [];
  const salida: Hallazgo[] = [];

  const enOrigen = extraerNumeros(s.origen);
  const enDestino = extraerNumeros(s.destino);

  const perdidos = faltantes(enOrigen, enDestino);
  const agregados = faltantes(enDestino, enOrigen);

  if (perdidos.length) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'numeros',
        etiqueta: 'numero-fecha',
        severidad: 'alta',
        mensaje: `Cifras del original que no aparecen en la traducción: ${perdidos.join(', ')}.`,
        detalle:
          'Puede ser correcto si la cifra se escribió con letras; si no, hay una omisión o un error de transcripción.',
        fragmento: truncar(s.origen, 160),
      }),
    );
  }

  if (agregados.length) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'numeros',
        etiqueta: 'numero-fecha',
        severidad: 'media',
        mensaje: `Cifras en la traducción que no están en el original: ${agregados.join(', ')}.`,
        fragmento: truncar(s.destino, 160),
      }),
    );
  }

  const fechasOrigen = extraerFechas(s.origen);
  const fechasDestino = extraerFechas(s.destino);
  if (fechasOrigen.length !== fechasDestino.length) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'fechas',
        etiqueta: 'numero-fecha',
        severidad: 'alta',
        mensaje: `El original tiene ${fechasOrigen.length} fecha(s) y la traducción ${fechasDestino.length}.`,
        fragmento: truncar(s.origen, 160),
      }),
    );
  } else if (fechasOrigen.length) {
    const perdidasFechas = faltantes(fechasOrigen, fechasDestino);
    if (perdidasFechas.length) {
      salida.push(
        hallazgo({
          segmentoId: s.id,
          segmentoIndice: s.indice,
          categoria: 'fechas',
          etiqueta: 'numero-fecha',
          severidad: 'alta',
          mensaje: `Fechas que no coinciden: ${perdidasFechas.join(', ')}.`,
          detalle:
            'Atención al orden día/mes: el inglés escribe mes/día y el español día/mes.',
          fragmento: truncar(s.destino, 160),
        }),
      );
    }
  }

  const marcadoresOrigen = extraerMarcadores(s.origen);
  if (marcadoresOrigen.length) {
    const perdidosMarcadores = faltantes(marcadoresOrigen, extraerMarcadores(s.destino));
    if (perdidosMarcadores.length) {
      salida.push(
        hallazgo({
          segmentoId: s.id,
          segmentoIndice: s.indice,
          categoria: 'formato',
          etiqueta: 'formato',
          severidad: 'alta',
          mensaje: `Marcadores del original que faltan en la traducción: ${perdidosMarcadores.join(', ')}.`,
          detalle: 'Las variables y las etiquetas tienen que pasar intactas a la traducción.',
          fragmento: truncar(s.origen, 160),
        }),
      );
    }
  }

  return salida;
}

function controlarFormato(s: Segmento): Hallazgo[] {
  if (!s.destino.trim()) return [];
  const salida: Hallazgo[] = [];
  const d = s.destino;

  if (/ {2,}/.test(d)) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'formato',
        etiqueta: 'formato',
        severidad: 'baja',
        mensaje: 'Espacios dobles en la traducción.',
        sugerencia: d.replace(/ {2,}/g, ' '),
      }),
    );
  }

  if (/\s+[,;.:]/.test(d)) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'puntuacion',
        etiqueta: 'formato',
        severidad: 'baja',
        mensaje: 'Espacio antes de un signo de puntuación.',
        sugerencia: d.replace(/\s+([,;.:])/g, '$1'),
      }),
    );
  }

  // Puntuación final: si el original cierra la oración, la traducción también.
  const finOrigen = s.origen.trim().slice(-1);
  const finDestino = d.trim().slice(-1);
  if ('.!?:;'.includes(finOrigen) && !'.!?:;»"\')'.includes(finDestino)) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'puntuacion',
        etiqueta: 'formato',
        severidad: 'baja',
        mensaje: `El original termina en «${finOrigen}» y la traducción no cierra con puntuación.`,
        fragmento: truncar(d, 120),
      }),
    );
  }

  const pares: [string, string, string][] = [
    ['(', ')', 'paréntesis'],
    ['[', ']', 'corchetes'],
    ['«', '»', 'comillas angulares'],
  ];
  for (const [abre, cierra, nombre] of pares) {
    const nAbre = d.split(abre).length - 1;
    const nCierra = d.split(cierra).length - 1;
    if (nAbre !== nCierra) {
      salida.push(
        hallazgo({
          segmentoId: s.id,
          segmentoIndice: s.indice,
          categoria: 'formato',
          etiqueta: 'formato',
          severidad: 'media',
          mensaje: `Los ${nombre} no están equilibrados (${nAbre} de apertura y ${nCierra} de cierre).`,
          fragmento: truncar(d, 120),
        }),
      );
    }
  }

  return salida;
}

function controlarLexico(s: Segmento, idiomaDestino: Idioma): Hallazgo[] {
  if (!s.destino.trim()) return [];
  const salida: Hallazgo[] = [];

  for (const regla of reglasPara(idiomaDestino)) {
    const re = new RegExp(regla.patron, 'giu');
    const coincidencia = re.exec(s.destino);
    if (!coincidencia) continue;

    if (regla.excepciones?.some((e) => s.destino.toLowerCase().includes(e.toLowerCase()))) continue;

    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'calco',
        etiqueta: regla.etiqueta,
        severidad: regla.severidad,
        mensaje: `«${coincidencia[0]}»: ${regla.mensaje}`,
        sugerencia: regla.sugerencia,
        fragmento: coincidencia[0],
      }),
    );
  }

  return salida;
}

function controlarEstiloSegmento(
  s: Segmento,
  estilo: EstiloTraduccion,
  idiomaDestino: Idioma,
): Hallazgo[] {
  if (idiomaDestino !== 'es' || !s.destino.trim()) return [];
  const salida: Hallazgo[] = [];
  const medidas = medirEstilo(s.destino, estilo.reglas);

  if (medidas.adverbios.length >= 2) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `${medidas.adverbios.length} adverbios en -mente en el mismo segmento: ${medidas.adverbios.map((a) => a.fragmento).join(', ')}.`,
        sugerencia:
          'Sustituir por locuciones adverbiales («con rapidez», «sin demora», «en su totalidad») o reformular.',
        fragmento: medidas.adverbios[0].fragmento,
      }),
    );
  }

  if (estilo.reglas.evitarGerundios && medidas.gerundios.length >= 2) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `${medidas.gerundios.length} gerundios en el mismo segmento: ${medidas.gerundios.map((g) => g.fragmento).join(', ')}.`,
        sugerencia: 'Reformular con una subordinada de relativo o dos oraciones independientes.',
        fragmento: medidas.gerundios[0].fragmento,
      }),
    );
  }

  if (estilo.reglas.evitarVozPasiva && medidas.pasivas.length >= 2) {
    salida.push(
      hallazgo({
        segmentoId: s.id,
        segmentoIndice: s.indice,
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `${medidas.pasivas.length} pasivas perifrásticas en el mismo segmento: ${medidas.pasivas.map((p) => p.fragmento).join(' · ')}.`,
        sugerencia: 'Pasar a voz activa o a pasiva refleja con «se».',
        fragmento: medidas.pasivas[0].fragmento,
      }),
    );
  }

  return salida;
}

/* ------------------------------------------------------------------ */
/* Controles de documento                                              */
/* ------------------------------------------------------------------ */

function controlarEstiloDocumento(
  segmentos: Segmento[],
  estilo: EstiloTraduccion,
  idiomaDestino: Idioma,
): Hallazgo[] {
  if (idiomaDestino !== 'es') return [];
  const texto = segmentos.map((s) => s.destino).filter(Boolean).join(' ');
  if (texto.length < 400) return [];

  const salida: Hallazgo[] = [];
  const m = medirEstilo(texto, estilo.reglas);

  if (m.adverbios.length > m.adverbiosPermitidos) {
    salida.push(
      hallazgo({
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `Adverbios en -mente por encima de la cuota: ${m.adverbios.length} en unas ${m.lineas} líneas, cuando el criterio del encargo admite ${m.adverbiosPermitidos} (uno cada diez líneas).`,
        detalle: `Aparecen: ${[...new Set(m.adverbios.map((a) => a.fragmento))].slice(0, 25).join(', ')}.`,
        sugerencia: 'Sustituir los menos necesarios por locuciones adverbiales.',
      }),
    );
  }

  if (estilo.reglas.evitarGerundios && m.gerundios.length > m.gerundiosPermitidos) {
    salida.push(
      hallazgo({
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `Uso alto de gerundios: ${m.gerundios.length} en ${m.palabras} palabras (el criterio admite unos ${m.gerundiosPermitidos}).`,
        detalle: `Aparecen: ${[...new Set(m.gerundios.map((g) => g.fragmento))].slice(0, 25).join(', ')}.`,
        sugerencia: 'Revisar sobre todo los gerundios de posterioridad y los especificativos.',
      }),
    );
  }

  if (estilo.reglas.evitarVozPasiva && m.pasivas.length > m.pasivasPermitidas) {
    salida.push(
      hallazgo({
        categoria: 'estilo',
        etiqueta: 'redaccion',
        severidad: 'media',
        mensaje: `Uso alto de voz pasiva: ${m.pasivas.length} construcciones en ${m.palabras} palabras (el criterio admite unas ${m.pasivasPermitidas}).`,
        detalle: `Ejemplos: ${[...new Set(m.pasivas.map((p) => p.fragmento))].slice(0, 15).join(' · ')}.`,
        sugerencia: 'Pasar a activa o a pasiva refleja las que no necesiten explicitar el agente.',
      }),
    );
  }

  return salida;
}

/** Segmentos idénticos en el original que se tradujeron de maneras distintas. */
function controlarSegmentosRepetidos(segmentos: Segmento[]): Hallazgo[] {
  const porOrigen = new Map<string, Segmento[]>();
  for (const s of segmentos) {
    if (!s.destino.trim()) continue;
    const clave = normalizar(s.origen);
    if (!clave || clave.split(' ').length < 2) continue;
    const grupo = porOrigen.get(clave);
    if (grupo) grupo.push(s);
    else porOrigen.set(clave, [s]);
  }

  const salida: Hallazgo[] = [];

  for (const grupo of porOrigen.values()) {
    if (grupo.length < 2) continue;
    const versiones = [...new Set(grupo.map((s) => normalizarSuave(s.destino)))];
    if (versiones.length < 2) continue;

    salida.push(
      hallazgo({
        segmentoId: grupo[0].id,
        segmentoIndice: grupo[0].indice,
        categoria: 'consistencia',
        etiqueta: 'inconsistencia-terminologica',
        severidad: 'alta',
        mensaje: `El mismo segmento del original se tradujo de ${versiones.length} maneras distintas.`,
        detalle: `Original: «${truncar(grupo[0].origen, 140)}».\nVersiones: ${grupo
          .map((s) => `[${s.indice + 1}] «${truncar(s.destino, 120)}»`)
          .join(' · ')}`,
        fragmento: truncar(grupo[0].origen, 140),
      }),
    );
  }

  return salida;
}

/**
 * Consistencia de los términos definidos: en un contrato o una sentencia, los
 * términos en mayúscula («the Purchaser», «Confidential Information») son
 * definiciones y tienen que traducirse siempre igual. Es una comprobación
 * acotada a propósito: da pocos falsos positivos y detecta lo que importa.
 */
function controlarTerminosDefinidos(segmentos: Segmento[]): Hallazgo[] {
  const VACIAS = new Set([
    'the', 'of', 'and', 'or', 'in', 'to', 'for', 'a', 'an', 'el', 'la', 'los', 'las',
    'de', 'del', 'y', 'o', 'en', 'por', 'para', 'un', 'una',
  ]);

  const apariciones = new Map<string, Segmento[]>();

  for (const s of segmentos) {
    if (!s.destino.trim()) continue;
    // Palabras capitalizadas en medio de la oración: en un contrato o una
    // sentencia son términos definidos («the Purchaser», «Confidential
    // Information») y tienen que traducirse siempre igual.
    const re = /(?<=[a-záéíóúñ,;:]\s)((?:\p{Lu}\p{Ll}{2,}\s+){0,3}\p{Lu}\p{Ll}{2,})/gu;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s.origen)) !== null) {
      const termino = m[1].trim();
      if (termino.split(/\s+/).some((p) => VACIAS.has(p.toLowerCase()))) continue;
      const clave = normalizar(termino);
      if (!clave) continue;
      const lista = apariciones.get(clave) ?? [];
      if (!lista.includes(s)) lista.push(s);
      apariciones.set(clave, lista);
    }
  }

  const salida: Hallazgo[] = [];

  for (const [clave, grupo] of apariciones) {
    if (grupo.length < 2 || grupo.length > 12) continue;

    // Raíces de las palabras con cuerpo de cada traducción. Se compara la raíz
    // y no la palabra entera para que la flexión no cuente como cambio de
    // término: «el Comprador» y «los Compradores» comparten «comprad».
    const raicesPorSegmento = grupo.map(
      (s) =>
        new Set(
          normalizar(s.destino)
            .split(' ')
            .filter((p) => p.length >= 5)
            .map((p) => p.slice(0, Math.max(4, p.length - 2))),
        ),
    );

    // Una raíz presente en todas las traducciones indica equivalente estable.
    const comunes = [...raicesPorSegmento[0]].filter((raiz) =>
      raicesPorSegmento.every((conjunto) => conjunto.has(raiz)),
    );
    if (comunes.length) continue;

    salida.push(
      hallazgo({
        segmentoId: grupo[0].id,
        segmentoIndice: grupo[0].indice,
        categoria: 'consistencia',
        etiqueta: 'inconsistencia-terminologica',
        severidad: 'media',
        mensaje: `El término definido «${clave}» aparece en ${grupo.length} segmentos y no se detecta un equivalente común en las traducciones.`,
        detalle: `Segmentos: ${grupo.map((s) => s.indice + 1).join(', ')}. En un documento con términos definidos, cada uno tiene que traducirse siempre igual.`,
        fragmento: clave,
      }),
    );
  }

  return salida;
}

/** Consistencia de los términos que el motor justificó explícitamente. */
function controlarTerminologiaJustificada(segmentos: Segmento[]): Hallazgo[] {
  const elecciones = new Map<string, Map<string, number[]>>();

  for (const s of segmentos) {
    for (const j of s.justificaciones) {
      const clave = normalizar(j.termino);
      if (!clave) continue;
      const porEleccion = elecciones.get(clave) ?? new Map<string, number[]>();
      const eleccion = normalizarSuave(j.eleccion);
      porEleccion.set(eleccion, [...(porEleccion.get(eleccion) ?? []), s.indice + 1]);
      elecciones.set(clave, porEleccion);
    }
  }

  const salida: Hallazgo[] = [];

  for (const [termino, porEleccion] of elecciones) {
    if (porEleccion.size < 2) continue;
    salida.push(
      hallazgo({
        categoria: 'consistencia',
        etiqueta: 'inconsistencia-terminologica',
        severidad: 'alta',
        mensaje: `«${termino}» se tradujo de ${porEleccion.size} maneras distintas.`,
        detalle: [...porEleccion.entries()]
          .map(([eleccion, indices]) => `«${eleccion}» en los segmentos ${indices.join(', ')}`)
          .join(' · '),
        sugerencia: 'Unificar el equivalente y guardarlo en el glosario del encargo.',
        fragmento: termino,
      }),
    );
  }

  return salida;
}

/* ------------------------------------------------------------------ */
/* Orquestador                                                         */
/* ------------------------------------------------------------------ */

export function controlPorReglas(opciones: {
  proyecto: Proyecto;
  estilo: EstiloTraduccion;
  entradasGlosario: EntradaGlosario[];
}): Hallazgo[] {
  const { proyecto, estilo, entradasGlosario } = opciones;
  const segmentos = proyecto.segmentos;
  const salida: Hallazgo[] = [];

  for (const s of segmentos) {
    salida.push(...controlarOmisiones(s));
    salida.push(...controlarNumeros(s));
    salida.push(...controlarFormato(s));
    salida.push(...controlarLexico(s, proyecto.idiomaDestino));
    salida.push(...controlarEstiloSegmento(s, estilo, proyecto.idiomaDestino));

    for (const anotacion of verificarGlosario(s, entradasGlosario)) {
      // El motivo que trae el glosario es la definición del término; sin el
      // término delante, el hallazgo no dice de qué habla.
      salida.push(
        hallazgo({
          segmentoId: s.id,
          segmentoIndice: s.indice,
          categoria: 'terminologia',
          etiqueta: anotacion.etiqueta,
          severidad: anotacion.severidad,
          mensaje: `«${anotacion.fragmento}»: ${truncar(anotacion.motivo, 160)}`,
          detalle: anotacion.motivo.length > 160 ? anotacion.motivo : undefined,
          sugerencia: anotacion.sugerencia,
          fragmento: anotacion.fragmento,
        }),
      );
    }
  }

  salida.push(...controlarSegmentosRepetidos(segmentos));
  salida.push(...controlarTerminosDefinidos(segmentos));
  salida.push(...controlarTerminologiaJustificada(segmentos));
  salida.push(...controlarEstiloDocumento(segmentos, estilo, proyecto.idiomaDestino));

  return salida;
}
