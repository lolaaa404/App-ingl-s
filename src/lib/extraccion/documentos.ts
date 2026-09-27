import 'server-only';

import JSZip from 'jszip';
import { EXTENSIONES_ADMITIDAS } from './formatos';
import { bloquesDesdeHtml, decodificarEntidades } from './html';
import { bloquesDesdeTextoPlano, type BloqueTexto } from '../segmentar';
import type { TipoBloque } from '../tipos';

/** Extracción de texto con estructura a partir de los formatos admitidos. */

export interface ResultadoExtraccion {
  bloques: BloqueTexto[];
  textoPlano: string;
  /** Avisos para la traductora: OCR aplicado, páginas vacías, etc. */
  avisos: string[];
}

function unirTexto(bloques: BloqueTexto[]): string {
  return bloques.map((b) => b.texto).join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Word (.docx)                                                        */
/* ------------------------------------------------------------------ */

export async function extraerDocx(buffer: Buffer): Promise<ResultadoExtraccion> {
  const mammoth = await import('mammoth');
  const { value: html, messages } = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ],
    },
  );

  const bloques = bloquesDesdeHtml(html);
  const avisos = messages
    .filter((m) => m.type === 'warning')
    .slice(0, 5)
    .map((m) => `Word: ${m.message}`);

  if (!bloques.length) avisos.push('No se encontró texto en el documento de Word.');

  return { bloques, textoPlano: unirTexto(bloques), avisos };
}

/* ------------------------------------------------------------------ */
/* PDF                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Se usan los elementos de texto con su tamaño de fuente en vez del texto
 * plano: permite reconstruir los párrafos por los saltos de línea reales y
 * reconocer los títulos por contraste de tamaño.
 */
export async function extraerPdf(buffer: Buffer): Promise<ResultadoExtraccion> {
  const { getDocumentProxy, extractTextItems } = await import('unpdf');
  const documento = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, items } = await extractTextItems(documento);

  const tamanos: number[] = [];
  for (const pagina of items) {
    for (const item of pagina) {
      if (item.str.trim() && item.fontSize > 0) tamanos.push(item.fontSize);
    }
  }
  tamanos.sort((a, b) => a - b);
  const tamanoBase = tamanos.length ? tamanos[Math.floor(tamanos.length / 2)] : 0;

  const bloques: BloqueTexto[] = [];
  const avisos: string[] = [];
  let paginasVacias = 0;

  items.forEach((pagina, indicePagina) => {
    let acumulado = '';
    let tamanoMax = 0;
    let hayTexto = false;

    const cerrar = () => {
      const texto = acumulado.replace(/\s+/g, ' ').trim();
      acumulado = '';
      if (!texto) {
        tamanoMax = 0;
        return;
      }
      const esTitulo =
        tamanoBase > 0 && tamanoMax >= tamanoBase * 1.25 && texto.length < 160;
      bloques.push({
        texto,
        tipo: esTitulo ? 'titulo' : 'parrafo',
        pagina: indicePagina + 1,
      });
      tamanoMax = 0;
    };

    for (const item of pagina) {
      if (item.str.trim()) hayTexto = true;
      acumulado += item.str;
      if (item.fontSize > tamanoMax) tamanoMax = item.fontSize;

      if (item.hasEOL) {
        // Un salto de línea cierra el párrafo solo si la línea ya termina en
        // puntuación o si queda un hueco; si no, es continuación de la frase.
        if (/[.:;!?»"')\]]\s*$/.test(acumulado) || acumulado.trim().length > 600) {
          cerrar();
        } else {
          acumulado += ' ';
        }
      }
    }
    cerrar();

    if (!hayTexto) paginasVacias++;
  });

  if (paginasVacias > 0) {
    avisos.push(
      paginasVacias === totalPages
        ? 'El PDF no tiene capa de texto: parece escaneado. Conviene procesarlo con OCR desde una imagen de cada página.'
        : `${paginasVacias} de ${totalPages} páginas no tienen texto seleccionable; pueden ser imágenes escaneadas.`,
    );
  }

  return { bloques, textoPlano: unirTexto(bloques), avisos };
}

/* ------------------------------------------------------------------ */
/* PowerPoint (.pptx)                                                  */
/* ------------------------------------------------------------------ */

/** Ordena slide2.xml antes que slide10.xml. */
function ordenNumerico(a: string, b: string): number {
  const n = (s: string) => Number(s.match(/(\d+)\.xml$/)?.[1] ?? 0);
  return n(a) - n(b);
}

export async function extraerPptx(buffer: Buffer): Promise<ResultadoExtraccion> {
  const zip = await JSZip.loadAsync(buffer);
  const nombres = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort(ordenNumerico);

  const bloques: BloqueTexto[] = [];
  const avisos: string[] = [];

  for (const [indice, nombre] of nombres.entries()) {
    const xml = await zip.file(nombre)!.async('string');
    const numero = indice + 1;

    bloques.push({ texto: `Diapositiva ${numero}`, tipo: 'encabezado', pagina: numero });

    // Cada <a:p> es un párrafo; dentro, cada <a:t> es una corrida de texto.
    const parrafos = [...xml.matchAll(/<a:p\b[^>]*>([\s\S]*?)<\/a:p>/g)];
    let primeroDeLaDiapositiva = true;

    for (const parrafo of parrafos) {
      const corridas = [...parrafo[1].matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)];
      const texto = decodificarEntidades(corridas.map((c) => c[1]).join(''))
        .replace(/\s+/g, ' ')
        .trim();
      if (!texto) continue;

      const tipo: TipoBloque = primeroDeLaDiapositiva ? 'titulo' : 'parrafo';
      bloques.push({ texto, tipo, nivel: primeroDeLaDiapositiva ? 2 : undefined, pagina: numero });
      primeroDeLaDiapositiva = false;
    }
  }

  // Notas del orador.
  const notas = Object.keys(zip.files)
    .filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))
    .sort(ordenNumerico);

  for (const [indice, nombre] of notas.entries()) {
    const xml = await zip.file(nombre)!.async('string');
    const texto = decodificarEntidades(
      [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1]).join(' '),
    )
      .replace(/\s+/g, ' ')
      .trim();
    if (texto && !/^\d+$/.test(texto)) {
      bloques.push({ texto, tipo: 'nota', pagina: indice + 1 });
    }
  }

  if (!bloques.length) avisos.push('No se encontró texto en la presentación.');

  return { bloques, textoPlano: unirTexto(bloques), avisos };
}

/* ------------------------------------------------------------------ */
/* Texto plano y Markdown                                              */
/* ------------------------------------------------------------------ */

export function extraerTexto(contenido: string): ResultadoExtraccion {
  const bloques = bloquesDesdeTextoPlano(contenido);
  return { bloques, textoPlano: contenido.trim(), avisos: [] };
}

/* ------------------------------------------------------------------ */
/* Selector por tipo de archivo                                        */
/* ------------------------------------------------------------------ */

export { EXTENSIONES_ADMITIDAS, TIPOS_IMAGEN, esImagen } from './formatos';

export async function extraerDocumento(
  nombre: string,
  tipo: string,
  buffer: Buffer,
): Promise<ResultadoExtraccion> {
  const extension = nombre.toLowerCase().slice(nombre.lastIndexOf('.'));

  if (extension === '.pdf' || tipo === 'application/pdf') {
    return extraerPdf(buffer);
  }
  if (extension === '.docx' || tipo.includes('wordprocessingml')) {
    return extraerDocx(buffer);
  }
  if (extension === '.pptx' || tipo.includes('presentationml')) {
    return extraerPptx(buffer);
  }
  if (extension === '.doc') {
    throw new Error(
      'El formato .doc antiguo no se admite. Hay que guardar el archivo como .docx y volver a subirlo.',
    );
  }
  if (['.txt', '.md', '.markdown', '.csv'].includes(extension) || tipo.startsWith('text/')) {
    return extraerTexto(buffer.toString('utf8'));
  }
  if (extension === '.rtf') {
    // El RTF se limpia de códigos de control y se trata como texto.
    const plano = buffer
      .toString('utf8')
      .replace(/\{\\\*?[^{}]*\}/g, ' ')
      .replace(/\\[a-z]+-?\d*\s?/gi, ' ')
      .replace(/[{}]/g, ' ')
      .replace(/[ \t]+/g, ' ');
    return extraerTexto(plano);
  }

  throw new Error(
    `No se puede leer «${nombre}». Formatos admitidos: ${EXTENSIONES_ADMITIDAS.join(', ')}.`,
  );
}
