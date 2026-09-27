/** Utilidades compartidas: identificadores, normalización y similitud. */

export function id(prefijo = ''): string {
  const base =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefijo ? `${prefijo}_${base}` : base;
}

export function ahora(): string {
  return new Date().toISOString();
}

/** Minúsculas, sin tildes ni puntuación, espacios colapsados. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Igual que normalizar pero conserva las tildes: para comparar términos. */
export function normalizarSuave(texto: string): string {
  return texto.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function palabras(texto: string): string[] {
  const n = normalizar(texto);
  return n ? n.split(' ') : [];
}

/** Distancia de Levenshtein con dos filas (memoria O(n)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let anterior = new Array<number>(b.length + 1);
  let actual = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) anterior[j] = j;

  for (let i = 1; i <= a.length; i++) {
    actual[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(actual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + coste);
    }
    const tmp = anterior;
    anterior = actual;
    actual = tmp;
  }
  return anterior[b.length];
}

/**
 * Similitud 0–100 entre dos segmentos. Combina distancia de edición sobre el
 * texto normalizado con solapamiento de palabras, que es más estable cuando
 * cambian solo unas pocas palabras de una frase larga.
 */
export function similitud(a: string, b: string): number {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (!na && !nb) return 100;
  if (!na || !nb) return 0;
  if (na === nb) return 100;

  const distancia = levenshtein(na, nb);
  const porEdicion = 1 - distancia / Math.max(na.length, nb.length);

  const pa = new Set(na.split(' '));
  const pb = new Set(nb.split(' '));
  let comunes = 0;
  for (const p of pa) if (pb.has(p)) comunes++;
  const porPalabras = (2 * comunes) / (pa.size + pb.size);

  return Math.round(Math.max(0, porEdicion * 0.6 + porPalabras * 0.4) * 100);
}

/** Escapa un texto para insertarlo dentro de una expresión regular. */
export function escapeRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Busca todas las apariciones de un término en un texto respetando los
 * límites de palabra en español (incluye tildes y ñ).
 */
export function aparicionesDe(texto: string, termino: string): { inicio: number; fin: number }[] {
  const t = termino.trim();
  if (!t) return [];
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(t)}(?![\\p{L}\\p{N}])`, 'giu');
  const resultado: { inicio: number; fin: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    resultado.push({ inicio: m.index, fin: m.index + m[0].length });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return resultado;
}

export function contiene(texto: string, termino: string): boolean {
  return aparicionesDe(texto, termino).length > 0;
}

export function truncar(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max - 1).trimEnd()}…`;
}

export function agrupar<T, K extends string>(items: T[], clave: (i: T) => K): Record<K, T[]> {
  const salida = {} as Record<K, T[]>;
  for (const item of items) {
    const k = clave(item);
    (salida[k] ??= []).push(item);
  }
  return salida;
}

/** Reparte un array en lotes de tamaño fijo. */
export function enLotes<T>(items: T[], tamano: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) lotes.push(items.slice(i, i + tamano));
  return lotes;
}

export function contarLineas(texto: string, anchoLinea = 90): number {
  const porSaltos = texto.split(/\n/).length;
  const porAncho = Math.ceil(texto.length / anchoLinea);
  return Math.max(porSaltos, porAncho, 1);
}
