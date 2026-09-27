import 'server-only';

import { generateText, Output } from 'ai';
import { esquemaQA } from './esquemas';
import { sistemaQA } from './prompts';
import { exigirClave, mensajeDeError, modeloPara } from './modelo';
import { controlPorReglas } from '../qa/reglas';
import { entradasAplicables } from '../glosario/deteccion';
import { ahora, id } from '../utiles';
import { SEVERIDAD_ORDEN } from '../etiquetas';
import type { EstiloTraduccion, Glosario, Hallazgo, InformeQA, Proyecto } from '../tipos';

/** Segmentos por lote en el control con IA: bastantes para ver la consistencia. */
const SEGMENTOS_POR_LOTE_QA = 25;

export async function controlarCalidad(opciones: {
  proyecto: Proyecto;
  estilo: EstiloTraduccion;
  glosarios: Glosario[];
  /** Añade la revisión con modelo encima del control por reglas. */
  conIA: boolean;
}): Promise<InformeQA> {
  const { proyecto, estilo, glosarios, conIA } = opciones;

  const textoCompleto = proyecto.segmentos.map((s) => s.origen).join('\n');
  const entradasGlosario = entradasAplicables(textoCompleto, glosarios, proyecto.idiomaOrigen);

  const hallazgos: Hallazgo[] = controlPorReglas({ proyecto, estilo, entradasGlosario });
  let sintesis: string | undefined;

  const traducidos = proyecto.segmentos.filter((s) => s.destino.trim());

  if (conIA && traducidos.length) {
    exigirClave();
    const sistema = sistemaQA({
      idiomaOrigen: proyecto.idiomaOrigen,
      idiomaDestino: proyecto.idiomaDestino,
      estilo,
      entradasGlosario,
      analisis: proyecto.analisis,
    });

    const sintesisParciales: string[] = [];

    for (let i = 0; i < traducidos.length; i += SEGMENTOS_POR_LOTE_QA) {
      const lote = traducidos.slice(i, i + SEGMENTOS_POR_LOTE_QA);
      const cuerpo = lote
        .map(
          (s) =>
            `[${s.id}] (segmento ${s.indice + 1}, ${s.bloque.tipo})\nORIGINAL: ${s.origen}\nTRADUCCIÓN: ${s.destino}`,
        )
        .join('\n\n');

      try {
        const { output } = await generateText({
          model: modeloPara('qa'),
          output: Output.object({ schema: esquemaQA }),
          system: sistema,
          prompt: `Revisa estos ${lote.length} pares (lote ${Math.floor(i / SEGMENTOS_POR_LOTE_QA) + 1}).\n\n${cuerpo}`,
        });

        if (output.sintesis) sintesisParciales.push(output.sintesis);

        const porId = new Map(proyecto.segmentos.map((s) => [s.id, s]));

        for (const h of output.hallazgos) {
          const segmento = h.segmentoId ? porId.get(h.segmentoId) : undefined;
          hallazgos.push({
            id: id('hz'),
            segmentoId: segmento?.id,
            segmentoIndice: segmento?.indice,
            categoria: h.categoria,
            etiqueta: h.etiqueta,
            severidad: h.severidad,
            mensaje: h.mensaje,
            detalle: h.detalle || undefined,
            sugerencia: h.sugerencia || undefined,
            fragmento: h.fragmento || undefined,
            origen: 'ia',
          });
        }
      } catch (error) {
        hallazgos.push({
          id: id('hz'),
          categoria: 'sentido',
          etiqueta: 'revisar-contexto',
          severidad: 'baja',
          mensaje: `No se pudo revisar con IA el lote de segmentos ${lote[0].indice + 1} a ${lote[lote.length - 1].indice + 1}.`,
          detalle: mensajeDeError(error),
          origen: 'regla',
        });
      }
    }

    sintesis = sintesisParciales.join(' ') || undefined;
  }

  return construirInforme(hallazgos, proyecto.segmentos.length, sintesis);
}

export function construirInforme(
  hallazgos: Hallazgo[],
  segmentosRevisados: number,
  sintesis?: string,
): InformeQA {
  const ordenados = [...hallazgos].sort((a, b) => {
    const porSeveridad = SEVERIDAD_ORDEN[a.severidad] - SEVERIDAD_ORDEN[b.severidad];
    if (porSeveridad !== 0) return porSeveridad;
    return (a.segmentoIndice ?? 1e9) - (b.segmentoIndice ?? 1e9);
  });

  const porCategoria: Record<string, number> = {};
  for (const h of ordenados) porCategoria[h.categoria] = (porCategoria[h.categoria] ?? 0) + 1;

  return {
    generado: ahora(),
    hallazgos: ordenados,
    totales: {
      alta: ordenados.filter((h) => h.severidad === 'alta').length,
      media: ordenados.filter((h) => h.severidad === 'media').length,
      baja: ordenados.filter((h) => h.severidad === 'baja').length,
      porCategoria,
    },
    segmentosRevisados,
    sintesis,
  };
}
