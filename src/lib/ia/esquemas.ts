import { z } from 'zod';

/** Esquemas de la salida estructurada del modelo. */

export const esquemaAnalisis = z.object({
  resumen: z
    .string()
    .describe(
      'Resumen contextual de tres a seis frases: de qué trata el documento, quién lo emite, para qué sirve y qué hay que tener en cuenta al traducirlo.',
    ),
  tipoDocumento: z
    .string()
    .describe('Tipo concreto: sentencia, contrato de compraventa, partida de nacimiento, prospecto…'),
  ambito: z.string().describe('Área temática o rama del derecho a la que pertenece.'),
  sistemaJuridico: z
    .enum(['common-law', 'civil-law', 'mixto', 'derecho-internacional', 'no-aplica'])
    .describe('Sistema jurídico del documento; «no-aplica» si el texto no es jurídico.'),
  jurisdiccion: z
    .string()
    .describe('País, estado o foro del que procede el documento. Cadena vacía si no consta.'),
  registro: z.string().describe('Registro y tono del original.'),
  publico: z.string().describe('Destinatario del documento.'),
  proposito: z.string().describe('Función que cumple el documento.'),
  estiloRecomendado: z
    .string()
    .describe('Identificador del estilo de traducción más adecuado de la lista disponible.'),
  riesgos: z
    .array(
      z.object({
        termino: z.string(),
        motivo: z.string().describe('Por qué el término es delicado.'),
        sugerencia: z.string().describe('Cómo conviene resolverlo.'),
        sinEquivalente: z
          .boolean()
          .describe('true si la figura no tiene equivalente exacto en el idioma de destino.'),
      }),
    )
    .describe('Entre tres y diez términos o expresiones que exigen decisión terminológica.'),
  convenciones: z
    .array(z.string())
    .describe('Criterios a respetar en todo el documento: qué no se traduce, cómo van las fechas…'),
  advertencias: z
    .array(z.string())
    .describe('Problemas del original: texto ilegible, pasajes ambiguos, erratas, incoherencias.'),
});

export type SalidaAnalisis = z.infer<typeof esquemaAnalisis>;

const esquemaAnotacion = z.object({
  fragmento: z
    .string()
    .describe('Fragmento exacto, copiado tal cual, del texto que se marca. Debe existir literalmente.'),
  ambito: z.enum(['origen', 'destino']).describe('En qué texto está el fragmento.'),
  etiqueta: z.enum([
    'revisar-termino',
    'posible-calco',
    'sin-equivalente-exacto',
    'revisar-contexto',
    'varias-opciones',
    'fuera-de-glosario',
    'anglicismo',
    'gramatica',
    'redaccion',
  ]),
  motivo: z.string().describe('Explicación breve, de una o dos frases.'),
  opciones: z.array(z.string()).describe('Traducciones alternativas. Vacío si no hay.'),
  sugerencia: z.string().describe('Propuesta concreta de corrección. Cadena vacía si no aplica.'),
  severidad: z.enum(['alta', 'media', 'baja']),
});

const esquemaJustificacion = z.object({
  termino: z.string().describe('Término del original.'),
  eleccion: z.string().describe('Traducción elegida.'),
  razonamiento: z.string().describe('Por qué se eligió, en dos o tres frases.'),
  fuentes: z
    .array(
      z.object({
        titulo: z.string(),
        tipo: z.enum([
          'glosario',
          'diccionario',
          'memoria',
          'legislacion',
          'doctrina',
          'organismo',
          'uso-atestiguado',
          'otra',
        ]),
        referencia: z.string().describe('Artículo, página o localización. Vacío si no aplica.'),
      }),
    )
    .describe('Fuentes en las que se apoya la decisión.'),
  alternativas: z
    .array(z.object({ opcion: z.string(), porQueNo: z.string() }))
    .describe('Opciones descartadas y el motivo.'),
});

export const esquemaTraduccion = z.object({
  segmentos: z.array(
    z.object({
      id: z.string().describe('Identificador del segmento, copiado del que se entregó.'),
      traduccion: z.string().describe('Traducción del segmento.'),
      anotaciones: z.array(esquemaAnotacion),
      justificaciones: z
        .array(esquemaJustificacion)
        .describe(
          'Solo para términos sin equivalencia exacta o con varias opciones defendibles. Vacío en los segmentos sin dificultad.',
        ),
    }),
  ),
});

export type SalidaTraduccion = z.infer<typeof esquemaTraduccion>;

export const esquemaQA = z.object({
  sintesis: z
    .string()
    .describe('Valoración general de la traducción en tres a cinco frases.'),
  hallazgos: z.array(
    z.object({
      segmentoId: z.string().describe('Identificador del segmento afectado. Vacío si es general.'),
      categoria: z.enum([
        'terminologia',
        'consistencia',
        'omision',
        'gramatica',
        'numeros',
        'fechas',
        'formato',
        'estilo',
        'calco',
        'puntuacion',
        'sentido',
      ]),
      etiqueta: z.enum([
        'revisar-termino',
        'posible-calco',
        'sin-equivalente-exacto',
        'revisar-contexto',
        'inconsistencia-terminologica',
        'varias-opciones',
        'fuera-de-glosario',
        'anglicismo',
        'gramatica',
        'redaccion',
        'omision',
        'numero-fecha',
        'formato',
      ]),
      severidad: z.enum(['alta', 'media', 'baja']),
      mensaje: z.string().describe('Qué problema hay, en una frase.'),
      detalle: z.string().describe('Explicación. Cadena vacía si el mensaje se basta.'),
      sugerencia: z.string().describe('Corrección propuesta. Cadena vacía si no la hay.'),
      fragmento: z.string().describe('Fragmento afectado, copiado literalmente. Vacío si es general.'),
    }),
  ),
});

export type SalidaQA = z.infer<typeof esquemaQA>;

export const esquemaOcr = z.object({
  texto: z
    .string()
    .describe(
      'Transcripción completa del texto de la imagen, respetando el orden de lectura y los saltos de párrafo.',
    ),
  idiomaDetectado: z.string().describe('Idioma predominante del texto transcrito.'),
  bloques: z.array(
    z.object({
      texto: z.string(),
      tipo: z.enum(['titulo', 'parrafo', 'lista', 'tabla', 'encabezado', 'pie', 'nota', 'sello']),
    }),
  ),
  observaciones: z
    .array(z.string())
    .describe('Zonas ilegibles, sellos, firmas, texto manuscrito y otros elementos no textuales.'),
});

export type SalidaOcr = z.infer<typeof esquemaOcr>;
