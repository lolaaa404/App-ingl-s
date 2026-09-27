/**
 * Modelo de dominio de la aplicación de traducción.
 * Todo el vocabulario del sistema está en español: es el idioma de trabajo
 * de la traductora y evita la mezcla de términos en el código.
 */

export type Idioma = 'es' | 'en';

export const IDIOMAS: Record<Idioma, string> = {
  es: 'español',
  en: 'inglés',
};

/* ------------------------------------------------------------------ */
/* Etiquetas                                                           */
/* ------------------------------------------------------------------ */

export type EtiquetaId =
  | 'revisar-termino'
  | 'posible-calco'
  | 'sin-equivalente-exacto'
  | 'revisar-contexto'
  | 'inconsistencia-terminologica'
  | 'varias-opciones'
  | 'fuera-de-glosario'
  | 'anglicismo'
  | 'gramatica'
  | 'redaccion'
  | 'omision'
  | 'numero-fecha'
  | 'formato';

export interface DefinicionEtiqueta {
  id: EtiquetaId;
  nombre: string;
  descripcion: string;
  /** Clase de resaltado aplicada al fragmento dentro del texto. */
  clase: string;
  /** Clase del chip/badge en listados. */
  chip: string;
  /** Si el fragmento se muestra en negrita además de coloreado. */
  negrita: boolean;
}

/* ------------------------------------------------------------------ */
/* Anotaciones y justificaciones                                       */
/* ------------------------------------------------------------------ */

export type Severidad = 'alta' | 'media' | 'baja';
export type FuenteAnotacion = 'ia' | 'glosario' | 'regla' | 'memoria';

export interface Anotacion {
  id: string;
  etiqueta: EtiquetaId;
  /** Sobre qué texto cae el fragmento marcado. */
  ambito: 'origen' | 'destino';
  /** Fragmento exacto tal como aparece en el texto. */
  fragmento: string;
  motivo: string;
  /** Alternativas de traducción cuando hay más de una posibilidad. */
  opciones?: string[];
  sugerencia?: string;
  severidad: Severidad;
  fuente: FuenteAnotacion;
}

export interface FuenteConsultada {
  titulo: string;
  tipo:
    | 'glosario'
    | 'diccionario'
    | 'memoria'
    | 'legislacion'
    | 'doctrina'
    | 'organismo'
    | 'uso-atestiguado'
    | 'otra';
  referencia?: string;
}

export interface Justificacion {
  termino: string;
  eleccion: string;
  razonamiento: string;
  fuentes: FuenteConsultada[];
  alternativas?: { opcion: string; porQueNo: string }[];
}

/* ------------------------------------------------------------------ */
/* Segmentos                                                           */
/* ------------------------------------------------------------------ */

export type TipoBloque =
  | 'titulo'
  | 'parrafo'
  | 'lista'
  | 'tabla'
  | 'encabezado'
  | 'pie'
  | 'nota'
  | 'sello';

export interface BloqueMeta {
  tipo: TipoBloque;
  /** Nivel de título (1-6) o de anidación de lista. */
  nivel?: number;
  /** Posición dentro de una tabla, cuando corresponde. */
  tabla?: { indice: number; fila: number; columna: number; encabezado?: boolean };
  pagina?: number;
  /** Índice del párrafo de origen: permite reconstruir el documento. */
  parrafo: number;
}

export type EstadoSegmento = 'pendiente' | 'traducido' | 'editado' | 'confirmado';

export interface CoincidenciaMemoria {
  entradaId: string;
  similitud: number;
  origen: string;
  destino: string;
  notas?: string;
}

export interface Segmento {
  id: string;
  indice: number;
  origen: string;
  destino: string;
  /** Propuesta original del motor, para poder comparar con la edición. */
  propuesta?: string;
  estado: EstadoSegmento;
  bloque: BloqueMeta;
  anotaciones: Anotacion[];
  justificaciones: Justificacion[];
  coincidencias: CoincidenciaMemoria[];
  /** Coincidencia aplicada automáticamente (100 %) desde la memoria. */
  desdeMemoria?: boolean;
  comentario?: string;
}

/* ------------------------------------------------------------------ */
/* Análisis del texto fuente                                           */
/* ------------------------------------------------------------------ */

export type SistemaJuridico =
  | 'common-law'
  | 'civil-law'
  | 'mixto'
  | 'derecho-internacional'
  | 'no-aplica';

export interface RiesgoTerminologico {
  termino: string;
  motivo: string;
  sugerencia: string;
  sinEquivalente: boolean;
}

export interface AnalisisFuente {
  resumen: string;
  tipoDocumento: string;
  ambito: string;
  sistemaJuridico: SistemaJuridico;
  jurisdiccion?: string;
  registro: string;
  publico: string;
  proposito: string;
  estiloRecomendado: string;
  riesgos: RiesgoTerminologico[];
  convenciones: string[];
  advertencias: string[];
  generado: string;
}

/* ------------------------------------------------------------------ */
/* Estilos de traducción                                               */
/* ------------------------------------------------------------------ */

export interface ReglasEspanol {
  evitarGerundios: boolean;
  /** Gerundios tolerados cada 100 palabras. */
  maxGerundios100: number;
  evitarVozPasiva: boolean;
  /** Pasivas perifrásticas toleradas cada 100 palabras. */
  maxPasivas100: number;
  /** Adverbios en -mente tolerados cada diez líneas. */
  maxAdverbiosMenteDiezLineas: number;
  evitarAnglicismos: boolean;
  comillasAngulares: boolean;
}

export interface EstiloTraduccion {
  id: string;
  nombre: string;
  descripcion: string;
  registro: string;
  /** Instrucciones que se inyectan al motor de traducción. */
  instrucciones: string[];
  /** Esqueleto o plantilla del documento final (fórmulas, encabezados). */
  esqueleto?: string;
  reglas: ReglasEspanol;
  /** Los presets de fábrica no se pueden borrar, solo duplicar. */
  predefinido: boolean;
}

/* ------------------------------------------------------------------ */
/* Memoria de traducción                                               */
/* ------------------------------------------------------------------ */

export interface EntradaMemoria {
  id: string;
  origen: string;
  destino: string;
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  dominio?: string;
  estilo?: string;
  proyecto?: string;
  cliente?: string;
  notas?: string;
  creado: string;
  actualizado: string;
  usos: number;
}

/* ------------------------------------------------------------------ */
/* Glosarios                                                           */
/* ------------------------------------------------------------------ */

export interface EntradaGlosario {
  id: string;
  origen: string;
  destino: string;
  idiomaOrigen: Idioma;
  contexto?: string;
  definicion?: string;
  /** Traducciones vedadas para este término. */
  prohibidos: string[];
  /** La elección depende del contexto: se marca con color propio. */
  sensibleContexto: boolean;
  /** No existe equivalente exacto en el otro idioma. */
  sinEquivalente: boolean;
  notas?: string;
  fuentes: string[];
}

export interface Glosario {
  id: string;
  nombre: string;
  dominio: string;
  descripcion?: string;
  entradas: EntradaGlosario[];
  creado: string;
  actualizado: string;
}

/* ------------------------------------------------------------------ */
/* Diccionarios propios                                                */
/* ------------------------------------------------------------------ */

export interface EntradaDiccionario {
  id: string;
  termino: string;
  definicion: string;
  equivalente?: string;
  fuente?: string;
}

export interface Diccionario {
  id: string;
  nombre: string;
  descripcion?: string;
  entradas: EntradaDiccionario[];
  creado: string;
  actualizado: string;
}

/* ------------------------------------------------------------------ */
/* Control de calidad                                                  */
/* ------------------------------------------------------------------ */

export type CategoriaQA =
  | 'terminologia'
  | 'consistencia'
  | 'omision'
  | 'gramatica'
  | 'numeros'
  | 'fechas'
  | 'formato'
  | 'estilo'
  | 'calco'
  | 'puntuacion'
  | 'sentido';

export interface Hallazgo {
  id: string;
  segmentoId?: string;
  segmentoIndice?: number;
  categoria: CategoriaQA;
  etiqueta: EtiquetaId;
  severidad: Severidad;
  mensaje: string;
  detalle?: string;
  sugerencia?: string;
  fragmento?: string;
  origen: 'regla' | 'ia';
}

export interface InformeQA {
  generado: string;
  hallazgos: Hallazgo[];
  totales: {
    alta: number;
    media: number;
    baja: number;
    porCategoria: Record<string, number>;
  };
  /** Segmentos revisados por el control. */
  segmentosRevisados: number;
  /** Resumen redactado por el modelo, cuando se pidió el control con IA. */
  sintesis?: string;
}

/* ------------------------------------------------------------------ */
/* Proyectos                                                           */
/* ------------------------------------------------------------------ */

export interface ArchivoOrigen {
  nombre: string;
  tipo: string;
  tamano: number;
  /** Texto plano completo tal como se extrajo, para consulta y contexto. */
  textoPlano: string;
}

export interface Proyecto {
  id: string;
  nombre: string;
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilo: string;
  glosarios: string[];
  diccionarios: string[];
  archivo?: ArchivoOrigen;
  analisis?: AnalisisFuente;
  segmentos: Segmento[];
  qa?: InformeQA;
  notas?: string;
  creado: string;
  actualizado: string;
}

export interface ResumenProyecto {
  id: string;
  nombre: string;
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilo: string;
  segmentos: number;
  traducidos: number;
  confirmados: number;
  creado: string;
  actualizado: string;
}
