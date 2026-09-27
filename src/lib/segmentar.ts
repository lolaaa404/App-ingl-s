import type { BloqueMeta, Segmento, TipoBloque } from './tipos';
import { id } from './utiles';

/** Bloque de texto tal como sale de la extracción del documento. */
export interface BloqueTexto {
  texto: string;
  tipo: TipoBloque;
  nivel?: number;
  tabla?: { indice: number; fila: number; columna: number; encabezado?: boolean };
  pagina?: number;
}

/**
 * Abreviaturas que terminan en punto sin cerrar la oración. Sin esta lista el
 * segmentador parte «art. 1344 del Código Civil» en dos, que es justo lo que
 * arruina la traducción de un texto jurídico.
 */
const ABREVIATURAS = new Set(
  [
    // Tratamientos y profesiones
    'sr', 'sra', 'srta', 'sres', 'dr', 'dra', 'dres', 'lic', 'ing', 'arq', 'prof', 'mtro',
    'ldo', 'lda', 'excmo', 'excma', 'ilmo', 'ilma', 'hnos', 'gral', 'cnel', 'tte',
    // Referencias y citas
    'art', 'arts', 'inc', 'incs', 'cap', 'caps', 'pág', 'pags', 'págs', 'pag', 'p', 'pp',
    'núm', 'num', 'nro', 'nros', 'párr', 'parr', 'fs', 'ss', 'cfr', 'vid', 'cit', 'op',
    'ed', 'eds', 'vol', 'vols', 'trad', 'coord', 'dir', 'aa', 'vv', 'ap', 'apdo',
    // Latinismos y locuciones
    'etc', 'esp', 'aprox', 'máx', 'mín', 'max', 'min', 'cía', 'cia', 'depto', 'dpto',
    'av', 'avda', 'ctra', 'urb', 'izq', 'dcha', 'tel', 'fax', 'ext',
    // Sociedades y entidades
    'sa', 'sl', 'srl', 'slu', 'sau', 'inc', 'ltd', 'llc', 'plc', 'corp', 'co', 'bros',
    // Inglés
    'mr', 'mrs', 'ms', 'jr', 'st', 'ave', 'rd', 'blvd', 'vs', 'eg', 'ie', 'cf', 'fig',
    'figs', 'ch', 'sec', 'secs', 'no', 'nos', 'para', 'supp', 'rev', 'jan', 'feb', 'mar',
    'apr', 'jun', 'jul', 'aug', 'sept', 'sep', 'oct', 'nov', 'dec',
  ].map((a) => a.toLowerCase()),
);

/** Siglas con puntos internos: EE.UU., U.S.C., S.A. de C.V. */
const SIGLA_PUNTEADA = /(?:\p{Lu}\.){2,}$/u;

function esAbreviatura(fragmento: string): boolean {
  const limpio = fragmento.trimEnd();
  if (SIGLA_PUNTEADA.test(limpio)) return true;

  const ultima = limpio.split(/[\s(«"'¿¡]+/).pop() ?? '';
  const palabra = ultima
    .replace(/\.$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  if (!palabra) return false;
  if (ABREVIATURAS.has(palabra)) return true;
  // Una sola letra seguida de punto: inicial de un nombre propio.
  if (palabra.length === 1 && /\p{L}/u.test(palabra)) return true;
  // Número seguido de punto: numeración de lista o de cláusula.
  if (/^\d+$/.test(palabra)) return true;
  return false;
}

/**
 * Divide un bloque en oraciones. Se corta en «.», «!», «?» y «…» cuando les
 * sigue un espacio y un arranque de oración, salvo que lo anterior sea una
 * abreviatura, una sigla, un decimal o una numeración.
 */
export function dividirEnOraciones(texto: string): string[] {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (!limpio) return [];

  const oraciones: string[] = [];
  let inicio = 0;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (c !== '.' && c !== '!' && c !== '?' && c !== '…') continue;

    // Agrupa signos consecutivos: «?!», «...».
    let fin = i;
    while (fin + 1 < limpio.length && '.!?…'.includes(limpio[fin + 1])) fin++;

    // Cierre de comillas o paréntesis que pertenecen a la oración.
    let corte = fin + 1;
    while (corte < limpio.length && '»"\')]”'.includes(limpio[corte])) corte++;

    const siguiente = limpio.slice(corte);
    if (!/^\s/.test(siguiente)) {
      i = fin;
      continue;
    }

    const resto = siguiente.trimStart();
    if (!resto) break;

    // Arranque de oración: mayúscula, apertura, cifra o guion de diálogo.
    const arranca = /^[\p{Lu}¿¡«"'(\[\d—–-]/u.test(resto);
    if (!arranca) {
      i = fin;
      continue;
    }

    // Decimal: 3.5 — no corta.
    if (c === '.' && /\d$/.test(limpio.slice(0, i)) && /^\d/.test(resto)) {
      i = fin;
      continue;
    }

    if (c === '.' && esAbreviatura(limpio.slice(inicio, i + 1))) {
      i = fin;
      continue;
    }

    const oracion = limpio.slice(inicio, corte).trim();
    if (oracion) oraciones.push(oracion);
    inicio = corte;
    i = corte - 1;
  }

  const cola = limpio.slice(inicio).trim();
  if (cola) oraciones.push(cola);

  return oraciones.length ? oraciones : [limpio];
}

/**
 * Tipos de bloque que no se parten en oraciones: un título o una celda de
 * tabla se traduce como unidad, aunque contenga un punto.
 */
const BLOQUES_ATOMICOS: TipoBloque[] = ['titulo', 'tabla', 'encabezado', 'pie', 'sello'];

export function segmentar(bloques: BloqueTexto[]): Segmento[] {
  const segmentos: Segmento[] = [];
  let indice = 0;

  bloques.forEach((bloque, numeroParrafo) => {
    const texto = bloque.texto.trim();
    if (!texto) return;

    const partes = BLOQUES_ATOMICOS.includes(bloque.tipo)
      ? [texto]
      : dividirEnOraciones(texto);

    for (const parte of partes) {
      if (!parte.trim()) continue;
      const meta: BloqueMeta = {
        tipo: bloque.tipo,
        nivel: bloque.nivel,
        tabla: bloque.tabla,
        pagina: bloque.pagina,
        parrafo: numeroParrafo,
      };
      segmentos.push({
        id: id('sg'),
        indice: indice++,
        origen: parte.trim(),
        destino: '',
        estado: 'pendiente',
        bloque: meta,
        anotaciones: [],
        justificaciones: [],
        coincidencias: [],
      });
    }
  });

  return segmentos;
}

/** Convierte texto plano pegado a mano en bloques, respetando líneas en blanco. */
export function bloquesDesdeTextoPlano(texto: string): BloqueTexto[] {
  const parrafos = texto
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return parrafos.map((p) => {
    const lineas = p.split('\n').map((l) => l.trim());
    const unaLinea = lineas.length === 1;
    const corto = p.length <= 90;
    const sinPuntoFinal = !/[.:;!?]$/.test(p);
    const enMayusculas = p === p.toUpperCase() && /\p{L}/u.test(p);

    let tipo: TipoBloque = 'parrafo';
    if (unaLinea && corto && (sinPuntoFinal || enMayusculas)) tipo = 'titulo';
    if (/^\s*([-*•·]|\d+[.)]|[a-z][.)])\s+/i.test(p)) tipo = 'lista';

    return { texto: p, tipo };
  });
}
