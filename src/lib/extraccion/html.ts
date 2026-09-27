import type { BloqueTexto } from '../segmentar';
import type { TipoBloque } from '../tipos';

/**
 * Conversión de HTML a bloques. Se usa para los .docx, que mammoth entrega
 * como HTML: así se conservan los títulos, las listas y las tablas, que es lo
 * que permite reconstruir el documento con la disposición del original.
 *
 * No se usa un DOM completo a propósito: el HTML que produce mammoth es
 * regular y predecible, y evitar jsdom mantiene el arranque liviano.
 */

const ENTIDADES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  deg: '°',
  eacute: 'é',
  aacute: 'á',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  uuml: 'ü',
};

export function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (entero, nombre: string) => ENTIDADES[nombre.toLowerCase()] ?? entero);
}

/** Quita etiquetas en línea y deja el texto legible. */
export function textoPlano(html: string): string {
  return decodificarEntidades(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img\b[^>]*>/gi, ' [Imagen] ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function tipoDeEtiqueta(etiqueta: string): { tipo: TipoBloque; nivel?: number } {
  const e = etiqueta.toLowerCase();
  if (/^h[1-6]$/.test(e)) return { tipo: 'titulo', nivel: Number(e[1]) };
  if (e === 'li') return { tipo: 'lista' };
  if (e === 'blockquote') return { tipo: 'nota' };
  return { tipo: 'parrafo' };
}

interface Hallado {
  posicion: number;
  bloques: BloqueTexto[];
}

function extraerTablas(html: string, desde: number): Hallado[] {
  const resultado: Hallado[] = [];
  const reTabla = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let m: RegExpExecArray | null;
  let indiceTabla = desde;

  while ((m = reTabla.exec(html)) !== null) {
    const bloques: BloqueTexto[] = [];
    const filas = [...m[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];

    filas.forEach((fila, numeroFila) => {
      const celdas = [...fila[1].matchAll(/<(t[dh])\b[^>]*>([\s\S]*?)<\/\1>/gi)];
      celdas.forEach((celda, numeroColumna) => {
        const contenido = textoPlano(celda[2]);
        if (!contenido) return;
        bloques.push({
          texto: contenido,
          tipo: 'tabla',
          tabla: {
            indice: indiceTabla,
            fila: numeroFila,
            columna: numeroColumna,
            encabezado: celda[1].toLowerCase() === 'th' || numeroFila === 0,
          },
        });
      });
    });

    if (bloques.length) resultado.push({ posicion: m.index, bloques });
    indiceTabla++;
  }

  return resultado;
}

export function bloquesDesdeHtml(html: string): BloqueTexto[] {
  const tablas = extraerTablas(html, 0);

  // Se reemplaza cada tabla por relleno del mismo largo para no desplazar las
  // posiciones de los demás bloques y poder ordenarlos al final.
  let sinTablas = html;
  for (const t of tablas) {
    const reTabla = /<table\b[^>]*>[\s\S]*?<\/table>/i;
    sinTablas = sinTablas.replace(reTabla, (coincidencia) => ' '.repeat(coincidencia.length));
  }

  const sueltos: Hallado[] = [];
  const reBloque = /<(h[1-6]|p|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;

  while ((m = reBloque.exec(sinTablas)) !== null) {
    const contenido = textoPlano(m[2]);
    if (!contenido) continue;
    const { tipo, nivel } = tipoDeEtiqueta(m[1]);
    sueltos.push({ posicion: m.index, bloques: [{ texto: contenido, tipo, nivel }] });
  }

  const todos = [...tablas, ...sueltos].sort((a, b) => a.posicion - b.posicion);
  const bloques = todos.flatMap((h) => h.bloques);

  // Si el HTML no traía bloques reconocibles, se cae al texto plano.
  if (!bloques.length) {
    const plano = textoPlano(html);
    return plano ? [{ texto: plano, tipo: 'parrafo' }] : [];
  }

  return bloques;
}
