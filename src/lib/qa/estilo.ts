import type { ReglasEspanol } from '../tipos';

/**
 * Comprobaciones de redacción en español: gerundios, voz pasiva y adverbios
 * en -mente. Son los tres criterios que pidió la traductora y se calculan por
 * regla, sin pasar por el modelo, para que el resultado sea siempre el mismo.
 */

export interface Aparicion {
  fragmento: string;
  inicio: number;
}

/**
 * Palabras terminadas en -ando/-iendo que no son gerundios. Sin esta lista,
 * «bando», «mando» o un nombre propio como «Fernando» darían falso positivo.
 */
const NO_GERUNDIOS = new Set([
  'blando', 'bando', 'mando', 'rando', 'nefando', 'infando', 'comando', 'orlando',
  'fernando', 'armando', 'hernando', 'rolando', 'zando', 'grando', 'sando',
  'estruendo', 'tremendo', 'horrendo', 'reverendo', 'dividendo', 'minuendo',
  'sustraendo', 'doctorando', 'graduando', 'educando', 'ordenando', 'sumando',
  'multiplicando', 'memorando', 'vendo', 'siendo',
]);

export function detectarGerundios(texto: string): Aparicion[] {
  const salida: Aparicion[] = [];
  const re = /\p{L}{4,}(?:ando|[ií]endo|yendo)\b/gu;
  let m: RegExpExecArray | null;

  while ((m = re.exec(texto)) !== null) {
    const palabra = m[0];
    // Los nombres propios empiezan por mayúscula dentro de la oración.
    const empiezaOracion = m.index === 0 || /[.!?¿¡:\n]\s*$/.test(texto.slice(0, m.index));
    if (/^\p{Lu}/u.test(palabra) && !empiezaOracion) continue;

    const clave = palabra
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    if (NO_GERUNDIOS.has(clave)) continue;

    salida.push({ fragmento: palabra, inicio: m.index });
  }

  return salida;
}

const PARTICIPIOS_IRREGULARES = [
  'hecho', 'hecha', 'hechos', 'hechas',
  'dicho', 'dicha', 'dichos', 'dichas',
  'escrito', 'escrita', 'escritos', 'escritas',
  'visto', 'vista', 'vistos', 'vistas',
  'puesto', 'puesta', 'puestos', 'puestas',
  'resuelto', 'resuelta', 'resueltos', 'resueltas',
  'abierto', 'abierta', 'abiertos', 'abiertas',
  'cubierto', 'cubierta', 'cubiertos', 'cubiertas',
  'impuesto', 'impuesta', 'impuestos', 'impuestas',
  'previsto', 'prevista', 'previstos', 'previstas',
  'suscrito', 'suscrita', 'suscritos', 'suscritas',
  'inscrito', 'inscrita', 'inscritos', 'inscritas',
  'roto', 'rota', 'rotos', 'rotas',
  'muerto', 'muerta', 'muertos', 'muertas',
  'devuelto', 'devuelta', 'devueltos', 'devueltas',
  'disuelto', 'disuelta', 'disueltos', 'disueltas',
];

const SER =
  '(?:es|son|era|eran|fue|fueron|ser[áa]|ser[áa]n|ser[íi]a|ser[íi]an|sido|sea|sean|fuera|fueran|fuese|fuesen|siendo|somos|fuimos|seremos)';

const PARTICIPIO = `(?:\\p{L}{3,}(?:ado|ada|ados|adas|ido|ida|idos|idas)|${PARTICIPIOS_IRREGULARES.join('|')})`;

/**
 * Pasiva perifrástica: «ser» conjugado seguido de participio, con un adverbio
 * opcional en medio («fue debidamente notificado»).
 */
export function detectarVozPasiva(texto: string): Aparicion[] {
  const salida: Aparicion[] = [];
  const re = new RegExp(
    `\\b(?:(?:ha|han|hab[íi]a|hab[íi]an|hubiera|hubiese|hubieran)\\s+)?${SER}\\s+(?:\\p{L}+mente\\s+)?${PARTICIPIO}\\b`,
    'giu',
  );

  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    // «es posible», «era necesario»: adjetivos, no participios pasivos.
    if (/\b(es|era|son|eran)\s+(posible|necesario|probable|evidente)\b/i.test(m[0])) continue;
    salida.push({ fragmento: m[0], inicio: m.index });
  }

  return salida;
}

export function detectarAdverbiosMente(texto: string): Aparicion[] {
  const salida: Aparicion[] = [];
  const re = /\b\p{L}{4,}mente\b/gu;
  let m: RegExpExecArray | null;

  while ((m = re.exec(texto)) !== null) {
    // «mente» y «demente» no son adverbios en -mente.
    if (/^(deme|cle|si|ve)mente$/i.test(m[0])) continue;
    salida.push({ fragmento: m[0], inicio: m.index });
  }

  return salida;
}

export function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  if (!limpio) return 0;
  return limpio.split(/\s+/).length;
}

/** Ancho convencional de una línea mecanografiada, para la cuota de adverbios. */
export const CARACTERES_POR_LINEA = 90;

export function lineasEquivalentes(texto: string): number {
  return Math.max(1, Math.ceil(texto.length / CARACTERES_POR_LINEA));
}

export interface MedidasEstilo {
  palabras: number;
  lineas: number;
  gerundios: Aparicion[];
  pasivas: Aparicion[];
  adverbios: Aparicion[];
  /** Cuántos adverbios en -mente se admiten con la regla del encargo. */
  adverbiosPermitidos: number;
  gerundiosPermitidos: number;
  pasivasPermitidas: number;
}

export function medirEstilo(texto: string, reglas: ReglasEspanol): MedidasEstilo {
  const nPalabras = contarPalabras(texto);
  const nLineas = lineasEquivalentes(texto);

  return {
    palabras: nPalabras,
    lineas: nLineas,
    gerundios: detectarGerundios(texto),
    pasivas: detectarVozPasiva(texto),
    adverbios: detectarAdverbiosMente(texto),
    adverbiosPermitidos: Math.max(
      1,
      Math.floor((nLineas / 10) * reglas.maxAdverbiosMenteDiezLineas),
    ),
    gerundiosPermitidos: Math.max(1, Math.round((nPalabras / 100) * reglas.maxGerundios100)),
    pasivasPermitidas: Math.max(1, Math.round((nPalabras / 100) * reglas.maxPasivas100)),
  };
}
