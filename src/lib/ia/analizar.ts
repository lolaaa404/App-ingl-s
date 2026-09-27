import 'server-only';

import { generateText, Output } from 'ai';
import { esquemaAnalisis } from './esquemas';
import { sistemaAnalisis } from './prompts';
import { exigirClave, mensajeDeError, modeloPara } from './modelo';
import { detectarSinEquivalente } from '../glosario/deteccion';
import { ahora, truncar } from '../utiles';
import type { AnalisisFuente, EstiloTraduccion, Idioma } from '../tipos';

/**
 * Interpretación del texto fuente antes de traducir: produce la ficha de
 * contexto que lee la traductora y que después alimenta al motor de
 * traducción en cada lote.
 */
export async function analizarFuente(opciones: {
  texto: string;
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilos: EstiloTraduccion[];
}): Promise<AnalisisFuente> {
  exigirClave();

  const { texto, idiomaOrigen, idiomaDestino, estilos } = opciones;

  // Con documentos largos se manda el principio y el final: el encabezamiento
  // identifica el documento y el cierre suele traer firmas, fechas y fórmulas.
  const muestra =
    texto.length <= 24000
      ? texto
      : `${texto.slice(0, 16000)}\n\n[…]\n\n${texto.slice(-8000)}`;

  const detectados = detectarSinEquivalente(muestra, idiomaOrigen);
  const pista = detectados.length
    ? `\n\nFiguras sin equivalente exacto ya detectadas por regla en este texto: ${detectados
        .map((t) => t.termino)
        .join(', ')}. Se pueden dar por identificadas; interesa que señales las que faltan.`
    : '';

  try {
    const { output } = await generateText({
      model: modeloPara('analisis'),
      output: Output.object({ schema: esquemaAnalisis }),
      system: sistemaAnalisis(
        idiomaOrigen,
        idiomaDestino,
        estilos.map((e) => ({ id: e.id, nombre: e.nombre, descripcion: e.descripcion })),
      ),
      prompt: `TEXTO FUENTE${texto.length > 24000 ? ' (fragmento inicial y final de un documento largo)' : ''}:\n\n${muestra}${pista}`,
    });

    const valido = estilos.some((e) => e.id === output.estiloRecomendado);

    return {
      ...output,
      jurisdiccion: output.jurisdiccion || undefined,
      estiloRecomendado: valido ? output.estiloRecomendado : estilos[0]?.id ?? 'general',
      generado: ahora(),
    };
  } catch (error) {
    throw new Error(`No se pudo analizar el texto fuente. ${mensajeDeError(error)}`);
  }
}

/** Resumen corto para mostrar mientras se espera el análisis completo. */
export function resumenProvisional(texto: string): string {
  return truncar(texto.replace(/\s+/g, ' ').trim(), 400);
}
