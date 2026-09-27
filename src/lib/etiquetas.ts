import type { DefinicionEtiqueta, EtiquetaId } from './tipos';

/**
 * Sistema de etiquetas. Cada una tiene un color propio para que la revisión
 * sea visual: el fragmento marcado se resalta dentro del texto traducido.
 *
 * Los términos que dependen del contexto llevan color propio (violeta) y no
 * se ponen en negrita, para distinguirlos de los que exigen una corrección.
 */
export const ETIQUETAS: Record<EtiquetaId, DefinicionEtiqueta> = {
  'revisar-termino': {
    id: 'revisar-termino',
    nombre: 'Revisar término',
    descripcion:
      'El término elegido merece una segunda lectura: puede haber una opción más precisa.',
    clase: 'bg-amber-200/70 text-amber-950 dark:bg-amber-400/25 dark:text-amber-100',
    chip: 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/30',
    negrita: true,
  },
  'posible-calco': {
    id: 'posible-calco',
    nombre: 'Posible calco',
    descripcion:
      'La estructura o el término reproducen el inglés en lugar de usar la forma natural del español.',
    clase: 'bg-rose-200/70 text-rose-950 dark:bg-rose-400/25 dark:text-rose-100',
    chip: 'bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-400/15 dark:text-rose-200 dark:ring-rose-400/30',
    negrita: true,
  },
  'sin-equivalente-exacto': {
    id: 'sin-equivalente-exacto',
    nombre: 'Sin equivalente exacto',
    descripcion:
      'La figura no existe como tal en el otro ordenamiento o ámbito: la elección se justifica aparte.',
    clase: 'bg-fuchsia-200/70 text-fuchsia-950 dark:bg-fuchsia-400/25 dark:text-fuchsia-100',
    chip: 'bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-300 dark:bg-fuchsia-400/15 dark:text-fuchsia-200 dark:ring-fuchsia-400/30',
    negrita: true,
  },
  'revisar-contexto': {
    id: 'revisar-contexto',
    nombre: 'Revisar contexto',
    descripcion:
      'La traducción depende del contexto: conviene confirmarla con el documento completo a la vista.',
    clase: 'bg-violet-200/60 text-violet-950 dark:bg-violet-400/20 dark:text-violet-100',
    chip: 'bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400/30',
    negrita: false,
  },
  'inconsistencia-terminologica': {
    id: 'inconsistencia-terminologica',
    nombre: 'Inconsistencia terminológica',
    descripcion:
      'El mismo término del original se tradujo de maneras distintas dentro del documento.',
    clase: 'bg-red-200/70 text-red-950 dark:bg-red-400/25 dark:text-red-100',
    chip: 'bg-red-100 text-red-900 ring-red-300 dark:bg-red-400/15 dark:text-red-200 dark:ring-red-400/30',
    negrita: true,
  },
  'varias-opciones': {
    id: 'varias-opciones',
    nombre: 'Varias opciones',
    descripcion: 'Hay más de una traducción defendible; se listan las alternativas.',
    clase: 'bg-sky-200/70 text-sky-950 dark:bg-sky-400/25 dark:text-sky-100',
    chip: 'bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-400/15 dark:text-sky-200 dark:ring-sky-400/30',
    negrita: true,
  },
  'fuera-de-glosario': {
    id: 'fuera-de-glosario',
    nombre: 'Fuera de glosario',
    descripcion: 'La traducción no coincide con la entrada del glosario cargado.',
    clase: 'bg-orange-200/70 text-orange-950 dark:bg-orange-400/25 dark:text-orange-100',
    chip: 'bg-orange-100 text-orange-900 ring-orange-300 dark:bg-orange-400/15 dark:text-orange-200 dark:ring-orange-400/30',
    negrita: true,
  },
  anglicismo: {
    id: 'anglicismo',
    nombre: 'Anglicismo',
    descripcion: 'Préstamo del inglés innecesario, con equivalente asentado en español.',
    clase: 'bg-pink-200/70 text-pink-950 dark:bg-pink-400/25 dark:text-pink-100',
    chip: 'bg-pink-100 text-pink-900 ring-pink-300 dark:bg-pink-400/15 dark:text-pink-200 dark:ring-pink-400/30',
    negrita: true,
  },
  gramatica: {
    id: 'gramatica',
    nombre: 'Gramática',
    descripcion: 'Concordancia, régimen preposicional, tiempos verbales u otro error gramatical.',
    clase: 'bg-teal-200/70 text-teal-950 dark:bg-teal-400/25 dark:text-teal-100',
    chip: 'bg-teal-100 text-teal-900 ring-teal-300 dark:bg-teal-400/15 dark:text-teal-200 dark:ring-teal-400/30',
    negrita: false,
  },
  redaccion: {
    id: 'redaccion',
    nombre: 'Redacción',
    descripcion:
      'Problema de estilo: abuso de gerundios, voz pasiva, adverbios en -mente o frase enrevesada.',
    clase: 'bg-lime-200/70 text-lime-950 dark:bg-lime-400/25 dark:text-lime-100',
    chip: 'bg-lime-100 text-lime-900 ring-lime-300 dark:bg-lime-400/15 dark:text-lime-200 dark:ring-lime-400/30',
    negrita: false,
  },
  omision: {
    id: 'omision',
    nombre: 'Omisión',
    descripcion: 'Contenido del original que no aparece en la traducción.',
    clase: 'bg-red-300/70 text-red-950 dark:bg-red-500/30 dark:text-red-100',
    chip: 'bg-red-100 text-red-900 ring-red-400 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-500/30',
    negrita: true,
  },
  'numero-fecha': {
    id: 'numero-fecha',
    nombre: 'Número o fecha',
    descripcion: 'Cifras, importes o fechas que no coinciden con el original.',
    clase: 'bg-yellow-200/70 text-yellow-950 dark:bg-yellow-400/25 dark:text-yellow-100',
    chip: 'bg-yellow-100 text-yellow-900 ring-yellow-300 dark:bg-yellow-400/15 dark:text-yellow-200 dark:ring-yellow-400/30',
    negrita: true,
  },
  formato: {
    id: 'formato',
    nombre: 'Formato',
    descripcion: 'Espaciado, comillas, mayúsculas, viñetas o estructura que no respeta el original.',
    clase: 'bg-slate-200/80 text-slate-900 dark:bg-slate-400/25 dark:text-slate-100',
    chip: 'bg-slate-100 text-slate-900 ring-slate-300 dark:bg-slate-400/15 dark:text-slate-200 dark:ring-slate-400/30',
    negrita: false,
  },
};

export const LISTA_ETIQUETAS = Object.values(ETIQUETAS);

export function etiqueta(id: EtiquetaId): DefinicionEtiqueta {
  return ETIQUETAS[id] ?? ETIQUETAS['revisar-termino'];
}

export const SEVERIDAD_ORDEN: Record<string, number> = { alta: 0, media: 1, baja: 2 };

export const CLASES_SEVERIDAD: Record<string, string> = {
  alta: 'bg-red-100 text-red-800 ring-red-300 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  media:
    'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  baja: 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30',
};

export const NOMBRES_CATEGORIA: Record<string, string> = {
  terminologia: 'Terminología',
  consistencia: 'Consistencia',
  omision: 'Omisiones',
  gramatica: 'Gramática',
  numeros: 'Números',
  fechas: 'Fechas',
  formato: 'Formato',
  estilo: 'Estilo',
  calco: 'Calcos',
  puntuacion: 'Puntuación',
  sentido: 'Sentido',
};
