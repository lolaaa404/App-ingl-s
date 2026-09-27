import { id } from '../utiles';
import type { EntradaDiccionario, EntradaGlosario, EntradaMemoria, Idioma } from '../tipos';

/**
 * Importación de glosarios, memorias y diccionarios desde archivos de tabla.
 *
 * Se admiten CSV, TSV y TMX. Las cabeceras se reconocen en español y en inglés
 * porque los glosarios que circulan entre traductores vienen de herramientas
 * distintas y rara vez usan los mismos nombres de columna.
 */

/** Parser de CSV/TSV con comillas dobles y saltos de línea dentro de campo. */
export function parsearTabla(contenido: string, separador?: string): string[][] {
  const texto = contenido.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const sep = separador ?? detectarSeparador(texto);

  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      entreComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = '';
    } else if (c === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += c;
    }
  }

  if (campo || fila.length) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((c) => c.trim()));
}

function detectarSeparador(texto: string): string {
  const primeraLinea = texto.split('\n')[0] ?? '';
  const tabulaciones = (primeraLinea.match(/\t/g) ?? []).length;
  const puntoYComa = (primeraLinea.match(/;/g) ?? []).length;
  const comas = (primeraLinea.match(/,/g) ?? []).length;

  if (tabulaciones >= puntoYComa && tabulaciones >= comas && tabulaciones > 0) return '\t';
  if (puntoYComa > comas) return ';';
  return ',';
}

const ALIAS: Record<string, string[]> = {
  origen: ['origen', 'source', 'termino', 'término', 'term', 'en', 'source term', 'texto origen', 'original'],
  destino: ['destino', 'target', 'traduccion', 'traducción', 'translation', 'es', 'target term', 'texto destino', 'equivalente'],
  contexto: ['contexto', 'context', 'ambito', 'ámbito', 'dominio', 'domain', 'subject'],
  definicion: ['definicion', 'definición', 'definition', 'descripcion', 'descripción', 'nota', 'notes', 'notas', 'comment', 'comentario'],
  prohibidos: ['prohibidos', 'forbidden', 'no usar', 'evitar', 'blacklist'],
  fuentes: ['fuentes', 'fuente', 'source ref', 'reference', 'referencia', 'referencias'],
};

function mapearCabeceras(cabeceras: string[]): Record<string, number> {
  const mapa: Record<string, number> = {};

  cabeceras.forEach((cabecera, indice) => {
    const limpia = cabecera
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

    for (const [campo, alias] of Object.entries(ALIAS)) {
      if (mapa[campo] !== undefined) continue;
      if (
        alias.some(
          (a) =>
            limpia === a.normalize('NFD').replace(/[̀-ͯ]/g, '') ||
            limpia.startsWith(a.normalize('NFD').replace(/[̀-ͯ]/g, '')),
        )
      ) {
        mapa[campo] = indice;
      }
    }
  });

  return mapa;
}

/** ¿La primera fila son cabeceras o ya son datos? */
function tieneCabecera(filas: string[][]): boolean {
  if (filas.length < 2) return false;
  const mapa = mapearCabeceras(filas[0]);
  return mapa.origen !== undefined || mapa.destino !== undefined;
}

export interface ResultadoImportacion<T> {
  entradas: T[];
  avisos: string[];
}

export function importarGlosario(
  contenido: string,
  idiomaOrigen: Idioma,
): ResultadoImportacion<EntradaGlosario> {
  const filas = parsearTabla(contenido);
  const avisos: string[] = [];
  if (!filas.length) return { entradas: [], avisos: ['El archivo está vacío.'] };

  const conCabecera = tieneCabecera(filas);
  const mapa = conCabecera ? mapearCabeceras(filas[0]) : {};
  const datos = conCabecera ? filas.slice(1) : filas;

  const columnaOrigen = mapa.origen ?? 0;
  const columnaDestino = mapa.destino ?? 1;

  if (!conCabecera) {
    avisos.push('No se reconocieron cabeceras: se tomó la primera columna como origen y la segunda como destino.');
  }

  const entradas: EntradaGlosario[] = [];
  let descartadas = 0;

  for (const fila of datos) {
    const origen = (fila[columnaOrigen] ?? '').trim();
    const destino = (fila[columnaDestino] ?? '').trim();
    if (!origen || !destino) {
      descartadas++;
      continue;
    }

    const prohibidos = (mapa.prohibidos !== undefined ? fila[mapa.prohibidos] ?? '' : '')
      .split(/[;|]/)
      .map((p) => p.trim())
      .filter(Boolean);

    const fuentes = (mapa.fuentes !== undefined ? fila[mapa.fuentes] ?? '' : '')
      .split(/[;|]/)
      .map((f) => f.trim())
      .filter(Boolean);

    entradas.push({
      id: id('gl'),
      origen,
      destino,
      idiomaOrigen,
      contexto: mapa.contexto !== undefined ? fila[mapa.contexto]?.trim() || undefined : undefined,
      definicion:
        mapa.definicion !== undefined ? fila[mapa.definicion]?.trim() || undefined : undefined,
      prohibidos,
      sensibleContexto: false,
      sinEquivalente: false,
      fuentes,
    });
  }

  if (descartadas) avisos.push(`Se descartaron ${descartadas} filas sin origen o sin destino.`);

  return { entradas, avisos };
}

export function importarMemoria(
  contenido: string,
  idiomaOrigen: Idioma,
  idiomaDestino: Idioma,
): ResultadoImportacion<Omit<EntradaMemoria, 'id' | 'creado' | 'actualizado' | 'usos'>> {
  // Los archivos .tmx son XML: se extraen las unidades de traducción.
  if (/<tmx\b/i.test(contenido) || /<tu\b/i.test(contenido)) {
    return importarTmx(contenido, idiomaOrigen, idiomaDestino);
  }

  const { entradas, avisos } = importarGlosario(contenido, idiomaOrigen);

  return {
    entradas: entradas.map((e) => ({
      origen: e.origen,
      destino: e.destino,
      idiomaOrigen,
      idiomaDestino,
      dominio: e.contexto,
      notas: e.definicion,
    })),
    avisos,
  };
}

function importarTmx(
  contenido: string,
  idiomaOrigen: Idioma,
  idiomaDestino: Idioma,
): ResultadoImportacion<Omit<EntradaMemoria, 'id' | 'creado' | 'actualizado' | 'usos'>> {
  const entradas: Omit<EntradaMemoria, 'id' | 'creado' | 'actualizado' | 'usos'>[] = [];
  const avisos: string[] = [];

  const unidades = [...contenido.matchAll(/<tu\b[^>]*>([\s\S]*?)<\/tu>/gi)];

  for (const unidad of unidades) {
    const variantes = [...unidad[1].matchAll(/<tuv\b([^>]*)>([\s\S]*?)<\/tuv>/gi)];
    const porIdioma = new Map<string, string>();

    for (const v of variantes) {
      const idioma = v[1].match(/xml:lang\s*=\s*"([^"]+)"/i)?.[1] ?? v[1].match(/lang\s*=\s*"([^"]+)"/i)?.[1];
      const texto = (v[2].match(/<seg>([\s\S]*?)<\/seg>/i)?.[1] ?? '')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();
      if (idioma && texto) porIdioma.set(idioma.slice(0, 2).toLowerCase(), texto);
    }

    const origen = porIdioma.get(idiomaOrigen);
    const destino = porIdioma.get(idiomaDestino);
    if (origen && destino) {
      entradas.push({ origen, destino, idiomaOrigen, idiomaDestino });
    }
  }

  if (!entradas.length) {
    avisos.push(
      `No se encontraron unidades con el par ${idiomaOrigen}→${idiomaDestino} en el archivo TMX.`,
    );
  }

  return { entradas, avisos };
}

export function importarDiccionario(contenido: string): ResultadoImportacion<EntradaDiccionario> {
  const avisos: string[] = [];

  // Formato de tabla.
  if (/[,;\t]/.test(contenido.split('\n')[0] ?? '')) {
    const filas = parsearTabla(contenido);
    const conCabecera = tieneCabecera(filas);
    const mapa = conCabecera ? mapearCabeceras(filas[0]) : {};
    const datos = conCabecera ? filas.slice(1) : filas;

    const entradas = datos
      .map((fila) => ({
        id: id('dc'),
        termino: (fila[mapa.origen ?? 0] ?? '').trim(),
        equivalente: (fila[mapa.destino ?? 1] ?? '').trim() || undefined,
        definicion: (fila[mapa.definicion ?? 2] ?? fila[mapa.destino ?? 1] ?? '').trim(),
        fuente: mapa.fuentes !== undefined ? fila[mapa.fuentes]?.trim() || undefined : undefined,
      }))
      .filter((e) => e.termino && e.definicion);

    return { entradas, avisos };
  }

  // Formato de texto: «término: definición» o «término = definición».
  const entradas: EntradaDiccionario[] = [];
  for (const linea of contenido.split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;

    const separacion = limpia.match(/^(.{1,80}?)\s*[:=–—]\s+(.+)$/);
    if (!separacion) continue;

    entradas.push({
      id: id('dc'),
      termino: separacion[1].trim(),
      definicion: separacion[2].trim(),
    });
  }

  if (!entradas.length) {
    avisos.push(
      'No se reconoció ninguna entrada. Formatos admitidos: CSV/TSV con columnas, o líneas «término: definición».',
    );
  }

  return { entradas, avisos };
}

/* ------------------------------------------------------------------ */
/* Exportación                                                         */
/* ------------------------------------------------------------------ */

function campoCsv(valor: string): string {
  return /[",;\n]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

export function glosarioACsv(entradas: EntradaGlosario[]): string {
  const cabecera = ['origen', 'destino', 'contexto', 'definicion', 'prohibidos', 'fuentes'];
  const filas = entradas.map((e) =>
    [
      e.origen,
      e.destino,
      e.contexto ?? '',
      e.definicion ?? '',
      e.prohibidos.join('; '),
      e.fuentes.join('; '),
    ]
      .map(campoCsv)
      .join(','),
  );
  return [cabecera.join(','), ...filas].join('\n');
}

export function memoriaACsv(entradas: EntradaMemoria[]): string {
  const cabecera = ['origen', 'destino', 'idiomaOrigen', 'idiomaDestino', 'dominio', 'proyecto', 'notas'];
  const filas = entradas.map((e) =>
    [e.origen, e.destino, e.idiomaOrigen, e.idiomaDestino, e.dominio ?? '', e.proyecto ?? '', e.notas ?? '']
      .map(campoCsv)
      .join(','),
  );
  return [cabecera.join(','), ...filas].join('\n');
}
