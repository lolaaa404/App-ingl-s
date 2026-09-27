import { SIN_EQUIVALENTE, formasDe, type TerminoSinEquivalente } from '../referencias/sin-equivalente';
import { aparicionesDe, contiene, id } from '../utiles';
import type { Anotacion, EntradaGlosario, Glosario, Idioma, Segmento } from '../tipos';

/**
 * Detección de terminología: qué entradas del glosario y qué figuras sin
 * equivalente aparecen en un texto, y si la traducción respeta el glosario.
 */

/** Entradas del glosario cuyo término de origen aparece en el texto dado. */
export function entradasAplicables(
  texto: string,
  glosarios: Glosario[],
  idiomaOrigen: Idioma,
): EntradaGlosario[] {
  const encontradas: EntradaGlosario[] = [];
  const vistas = new Set<string>();

  for (const glosario of glosarios) {
    for (const entrada of glosario.entradas) {
      if (entrada.idiomaOrigen !== idiomaOrigen) continue;
      if (vistas.has(entrada.id)) continue;
      if (contiene(texto, entrada.origen)) {
        encontradas.push(entrada);
        vistas.add(entrada.id);
      }
    }
  }

  // Los términos largos primero: son los más específicos y los que más pesan.
  return encontradas.sort((a, b) => b.origen.length - a.origen.length);
}

/** Figuras sin equivalente exacto presentes en el texto. */
export function detectarSinEquivalente(texto: string, idioma: Idioma): TerminoSinEquivalente[] {
  return SIN_EQUIVALENTE.filter(
    (t) => t.idioma === idioma && formasDe(t).some((forma) => contiene(texto, forma)),
  );
}

/**
 * Comprueba que la traducción respete el glosario: si el original trae un
 * término con equivalente fijado y la traducción no lo usa, se marca.
 */
export function verificarGlosario(
  segmento: Segmento,
  entradas: EntradaGlosario[],
): Anotacion[] {
  if (!segmento.destino.trim()) return [];
  const anotaciones: Anotacion[] = [];

  for (const entrada of entradas) {
    if (!contiene(segmento.origen, entrada.origen)) continue;

    // Una traducción vedada pesa más que la ausencia del equivalente.
    const prohibido = entrada.prohibidos.find((p) => p.trim() && contiene(segmento.destino, p));
    if (prohibido) {
      anotaciones.push({
        id: id('an'),
        etiqueta: 'fuera-de-glosario',
        ambito: 'destino',
        fragmento: prohibido,
        motivo: `El glosario veda «${prohibido}» para «${entrada.origen}».`,
        sugerencia: entrada.destino,
        opciones: entrada.destino ? [entrada.destino] : undefined,
        severidad: 'alta',
        fuente: 'glosario',
      });
      continue;
    }

    if (entrada.sinEquivalente) {
      anotaciones.push({
        id: id('an'),
        etiqueta: 'sin-equivalente-exacto',
        ambito: 'origen',
        fragmento: entrada.origen,
        motivo:
          entrada.definicion ??
          'Figura sin equivalente exacto en el otro ordenamiento según el glosario.',
        sugerencia: entrada.notas ?? entrada.destino,
        severidad: 'media',
        fuente: 'glosario',
      });
      continue;
    }

    if (entrada.sensibleContexto) {
      anotaciones.push({
        id: id('an'),
        etiqueta: 'revisar-contexto',
        ambito: 'origen',
        fragmento: entrada.origen,
        motivo:
          entrada.notas ??
          'El glosario marca este término como dependiente del contexto: conviene confirmar la elección.',
        sugerencia: entrada.destino,
        severidad: 'baja',
        fuente: 'glosario',
      });
      continue;
    }

    // Se aceptan variantes flexionadas: basta con la raíz del equivalente.
    if (entrada.destino.trim() && !contieneAproximado(segmento.destino, entrada.destino)) {
      anotaciones.push({
        id: id('an'),
        etiqueta: 'fuera-de-glosario',
        ambito: 'origen',
        fragmento: entrada.origen,
        motivo: `El glosario fija «${entrada.origen}» → «${entrada.destino}», y la traducción no lo usa.`,
        sugerencia: entrada.destino,
        severidad: 'media',
        fuente: 'glosario',
      });
    }
  }

  return anotaciones;
}

/**
 * Coincidencia tolerante con la flexión: «tribunal» encuentra «tribunales»,
 * «notificar» encuentra «notificación». Se compara la raíz de cada palabra
 * significativa del equivalente.
 */
function contieneAproximado(texto: string, termino: string): boolean {
  if (contiene(texto, termino)) return true;

  const significativas = termino
    .split(/\s+/)
    .filter((p) => p.length > 4)
    .map((p) => p.slice(0, Math.max(4, p.length - 3)));

  if (!significativas.length) return false;

  const normalizado = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  return significativas.every((raiz) =>
    normalizado.includes(raiz.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')),
  );
}

/** Anotaciones que marcan en el ORIGEN las figuras sin equivalente exacto. */
export function anotarSinEquivalente(
  segmento: Segmento,
  terminos: TerminoSinEquivalente[],
): Anotacion[] {
  const anotaciones: Anotacion[] = [];

  for (const termino of terminos) {
    for (const forma of formasDe(termino)) {
      if (!aparicionesDe(segmento.origen, forma).length) continue;
      anotaciones.push({
        id: id('an'),
        etiqueta: 'sin-equivalente-exacto',
        ambito: 'origen',
        fragmento: forma,
        motivo: termino.explicacion,
        opciones: termino.estrategias,
        sugerencia: termino.estrategias[0],
        severidad: 'media',
        fuente: 'glosario',
      });
      break;
    }
  }

  return anotaciones;
}
