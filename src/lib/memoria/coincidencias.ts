import type { CoincidenciaMemoria, EntradaMemoria, Idioma } from '../tipos';
import { normalizar, palabras, similitud } from '../utiles';

/**
 * Búsqueda de coincidencias en la memoria de traducción.
 *
 * La distancia de edición sobre toda la memoria sería cara, así que primero se
 * descartan las entradas imposibles con un índice invertido de palabras y una
 * comparación de longitudes; solo las candidatas llegan al cálculo fino.
 */

export interface IndiceMemoria {
  entradas: EntradaMemoria[];
  /** palabra normalizada -> posiciones en `entradas` */
  porPalabra: Map<string, number[]>;
}

export function construirIndice(
  entradas: EntradaMemoria[],
  idiomaOrigen: Idioma,
  idiomaDestino: Idioma,
): IndiceMemoria {
  const filtradas = entradas.filter(
    (e) => e.idiomaOrigen === idiomaOrigen && e.idiomaDestino === idiomaDestino,
  );

  const porPalabra = new Map<string, number[]>();
  filtradas.forEach((entrada, posicion) => {
    for (const palabra of new Set(palabras(entrada.origen))) {
      const lista = porPalabra.get(palabra);
      if (lista) lista.push(posicion);
      else porPalabra.set(palabra, [posicion]);
    }
  });

  return { entradas: filtradas, porPalabra };
}

export function buscarCoincidencias(
  origen: string,
  indice: IndiceMemoria,
  opciones: { limite?: number; umbral?: number } = {},
): CoincidenciaMemoria[] {
  const limite = opciones.limite ?? 3;
  const umbral = opciones.umbral ?? 62;

  const consulta = normalizar(origen);
  if (!consulta) return [];

  const palabrasConsulta = new Set(consulta.split(' '));
  const recuento = new Map<number, number>();

  for (const palabra of palabrasConsulta) {
    const posiciones = indice.porPalabra.get(palabra);
    if (!posiciones) continue;
    // Una palabra presente en casi toda la memoria no discrimina nada.
    if (posiciones.length > indice.entradas.length * 0.6 && indice.entradas.length > 40) continue;
    for (const p of posiciones) recuento.set(p, (recuento.get(p) ?? 0) + 1);
  }

  const candidatas = [...recuento.entries()]
    .filter(([posicion, comunes]) => {
      const entrada = indice.entradas[posicion];
      const largoEntrada = normalizar(entrada.origen).length;
      const razon = Math.min(largoEntrada, consulta.length) / Math.max(largoEntrada, consulta.length, 1);
      // Con longitudes muy dispares no se puede llegar al umbral.
      if (razon < 0.45) return false;
      return comunes / palabrasConsulta.size >= 0.3;
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60);

  const resultados: CoincidenciaMemoria[] = [];

  for (const [posicion] of candidatas) {
    const entrada = indice.entradas[posicion];
    const puntaje = similitud(origen, entrada.origen);
    if (puntaje < umbral) continue;
    resultados.push({
      entradaId: entrada.id,
      similitud: puntaje,
      origen: entrada.origen,
      destino: entrada.destino,
      notas: entrada.notas,
    });
  }

  return resultados.sort((a, b) => b.similitud - a.similitud).slice(0, limite);
}

/** Coincidencia exacta: se puede aplicar sin pasar por el modelo. */
export function coincidenciaPerfecta(
  coincidencias: CoincidenciaMemoria[],
): CoincidenciaMemoria | undefined {
  return coincidencias.find((c) => c.similitud === 100);
}
