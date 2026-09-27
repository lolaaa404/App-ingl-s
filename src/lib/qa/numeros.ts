/**
 * Comparación de cifras y fechas entre original y traducción.
 *
 * El formato cambia entre idiomas (1,000.50 frente a 1.000,50; 03/04/2024 que
 * en inglés es 4 de marzo y en español 3 de abril), así que todo se normaliza
 * a un valor canónico antes de comparar. Lo que se controla es el valor, no
 * cómo está escrito.
 */

/** Normaliza un número escrito con cualquier convención de separadores. */
export function valorNumerico(token: string): string {
  let s = token.replace(/[\s  ]/g, '');
  const punto = s.lastIndexOf('.');
  const coma = s.lastIndexOf(',');

  if (punto > -1 && coma > -1) {
    // El separador que aparece más a la derecha es el decimal.
    const decimal = punto > coma ? '.' : ',';
    const miles = decimal === '.' ? ',' : '.';
    s = s.split(miles).join('');
    s = s.replace(decimal, '.');
  } else if (coma > -1) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.split(',').join('') : s.replace(',', '.');
  } else if (punto > -1) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.split('.').join('');
  }

  const n = Number(s);
  return Number.isFinite(n) ? String(n) : token;
}

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
  noviembre: 11, diciembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8,
  sept: 9, sep: 9, oct: 10, nov: 11, dec: 12,
};

const NOMBRES_MES = Object.keys(MESES).join('|');

/** 12 de marzo de 2024 · 12 March 2024 */
const FECHA_DIA_PRIMERO = `\\b(\\d{1,2})(?:\\s*(?:de|of)\\s*|\\s+)(${NOMBRES_MES})\\.?(?:\\s*(?:de|of|,)\\s*|\\s+)(\\d{4})\\b`;
/** March 12, 2024 */
const FECHA_MES_PRIMERO = `\\b(${NOMBRES_MES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`;
/** 03/04/2024 · 2024-03-04 */
const FECHA_NUMERICA = '\\b(\\d{1,4})[/.\\-](\\d{1,2})[/.\\-](\\d{2,4})\\b';

/**
 * Cifras del texto. Las fechas se quitan antes de contar, porque ya las
 * compara el control de fechas: sin esto, un año distinto se denunciaría dos
 * veces y el informe se llenaría de ruido.
 */
export function extraerNumeros(texto: string): string[] {
  const sinFechas = texto
    .replace(new RegExp(FECHA_DIA_PRIMERO, 'gi'), ' ')
    .replace(new RegExp(FECHA_MES_PRIMERO, 'gi'), ' ')
    .replace(new RegExp(FECHA_NUMERICA, 'g'), ' ');

  const tokens = sinFechas.match(/\d+(?:[., \s]\d+)*/g) ?? [];
  return tokens.map(valorNumerico).filter((t) => t !== '');
}

/**
 * Extrae fechas como «año-mes-día». Las fechas puramente numéricas y
 * ambiguas (03/04/2024) se devuelven con el día y el mes ordenados, porque el
 * orden cambia entre el inglés y el español y no se puede resolver sin saber
 * qué convención usó el original.
 */
export function extraerFechas(texto: string): string[] {
  const fechas = new Set<string>();

  const reTextualDiaPrimero = new RegExp(FECHA_DIA_PRIMERO, 'gi');
  const reTextualMesPrimero = new RegExp(FECHA_MES_PRIMERO, 'gi');

  let m: RegExpExecArray | null;

  while ((m = reTextualDiaPrimero.exec(texto)) !== null) {
    const mes = MESES[m[2].toLowerCase()];
    if (mes) fechas.add(`${m[3]}-${String(mes).padStart(2, '0')}-${m[1].padStart(2, '0')}`);
  }

  while ((m = reTextualMesPrimero.exec(texto)) !== null) {
    const mes = MESES[m[1].toLowerCase()];
    if (mes) fechas.add(`${m[3]}-${String(mes).padStart(2, '0')}-${m[2].padStart(2, '0')}`);
  }

  // Numéricas: el día y el mes se guardan ordenados por ser ambiguos.
  const reNumerica = new RegExp(FECHA_NUMERICA, 'g');
  while ((m = reNumerica.exec(texto)) !== null) {
    const [, a, b, c] = m;
    if (a.length === 4) {
      fechas.add(`${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`);
    } else {
      const anio = c.length === 2 ? `20${c}` : c;
      const par = [Number(a), Number(b)].sort((x, y) => x - y);
      fechas.add(`${anio}~${par[0]}~${par[1]}`);
    }
  }

  return [...fechas];
}

/** Diferencia de multiconjuntos: qué falta en `b` respecto de `a`. */
export function faltantes(a: string[], b: string[]): string[] {
  const disponibles = new Map<string, number>();
  for (const v of b) disponibles.set(v, (disponibles.get(v) ?? 0) + 1);

  const salida: string[] = [];
  for (const v of a) {
    const n = disponibles.get(v) ?? 0;
    if (n > 0) disponibles.set(v, n - 1);
    else salida.push(v);
  }
  return salida;
}

/** Marcadores que tienen que sobrevivir intactos a la traducción. */
export function extraerMarcadores(texto: string): string[] {
  const patrones = [
    /\{[^{}\s]{1,40}\}/g, // {nombre}
    /%[sdif@]/g, // %s, %d
    /%\d+\$[sdif@]/g, // %1$s
    /\$\{[^{}]{1,40}\}/g, // ${variable}
    /<\/?[a-z][a-z0-9]*\s*\/?>/gi, // <b>, <br/>
    /\[\[[^\]]{1,40}\]\]/g, // [[clave]]
  ];

  const salida: string[] = [];
  for (const re of patrones) salida.push(...(texto.match(re) ?? []));
  return salida;
}
