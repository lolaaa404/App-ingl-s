import type { EstiloTraduccion, ReglasEspanol } from '../tipos';

/**
 * Criterios de redacción en español que se aplican por defecto a todos los
 * estilos. Son los que pidió la traductora: el gerundio y la pasiva
 * perifrástica se toleran solo cuando el español los pide, y los adverbios
 * en -mente se racionan (uno cada diez líneas).
 */
export const REGLAS_BASE: ReglasEspanol = {
  evitarGerundios: true,
  maxGerundios100: 2,
  evitarVozPasiva: true,
  maxPasivas100: 1,
  maxAdverbiosMenteDiezLineas: 1,
  evitarAnglicismos: true,
  comillasAngulares: true,
};

const ESQUELETO_PUBLICA = `TRADUCCIÓN PÚBLICA

[Si el encargo lo pide, una línea con la naturaleza del documento.]

— — — Cuerpo de la traducción, con la misma disposición del original — — —

Convenciones del cuerpo:
· Sellos, timbres, escudos y membretes: [Sello: …] · [Escudo: …] · [Membrete: …]
· Firmas: [Firma ilegible] · [Firma: NOMBRE] · [Firmado digitalmente por: …]
· Texto que no se puede leer: [ilegible]
· Errores del original: se reproducen y se anotan con [sic]
· Aclaraciones del traductor: [N. del T.: …]
· Espacios en blanco del formulario: [en blanco]
· Los nombres propios, las direcciones y los números no se traducen ni se convierten.

FÓRMULA DE CIERRE (inglés → español)
Es traducción fiel al idioma español del documento redactado en idioma inglés que he
tenido a la vista y al cual me remito, en la ciudad de ……………, a los …… días del mes de
…………… de 20…… .

FÓRMULA DE CIERRE (español → inglés)
I certify that the foregoing is a true and faithful translation into the English language
of the document written in the Spanish language which I have had before me and to which I
refer, in the city of ……………, on this …… day of …………… 20…… .`;

const ESQUELETO_SENTENCIA = `[TRIBUNAL]
[Autos / Carátula] — [N.º de expediente]

VISTOS:
[Antecedentes del caso.]

Y CONSIDERANDO:
[Fundamentos, numerados como en el original.]

POR ELLO, SE RESUELVE:
[Parte dispositiva, punto por punto.]

[Firmas y sellos, descritos entre corchetes.]`;

const ESQUELETO_CONTRATO = `[TÍTULO DEL CONTRATO]

Entre [PARTE A], en adelante «[definición]», y [PARTE B], en adelante «[definición]»,
se celebra el presente contrato, que se regirá por las siguientes cláusulas:

CLÁUSULA PRIMERA. Objeto.
CLÁUSULA SEGUNDA. Plazo.
CLÁUSULA TERCERA. Precio y forma de pago.
[…]

En prueba de conformidad, las partes firman el presente en [lugar], a [fecha].`;

export const ESTILOS_PREDEFINIDOS: EstiloTraduccion[] = [
  {
    id: 'general',
    nombre: 'General',
    descripcion:
      'Textos de circulación general: correspondencia, notas, contenidos informativos. Prioriza la naturalidad.',
    registro: 'Neutro, culto, accesible',
    instrucciones: [
      'Traducir el sentido, no las palabras: reformular cuando la estructura del original no funcione en el otro idioma.',
      'Mantener el tono del original (formal, cercano, institucional) sin subirlo ni bajarlo.',
      'Resolver las frases hechas con la frase hecha equivalente, no con una paráfrasis literal.',
      'Preferir el español general, sin marcas regionales fuertes, salvo que el original las tenga.',
    ],
    reglas: REGLAS_BASE,
    predefinido: true,
  },
  {
    id: 'publica',
    nombre: 'Traducción pública',
    descripcion:
      'Traducción con carácter oficial: partidas, títulos, poderes, sentencias y documentación para presentar ante organismos.',
    registro: 'Formal, literal en lo sustancial, fiel en la forma',
    instrucciones: [
      'Fidelidad completa: no se omite, no se resume y no se agrega nada. Todo elemento del original tiene su reflejo en la traducción.',
      'Se traduce la totalidad del documento, incluidos sellos, membretes, notas al pie, apostillas, leyendas de seguridad y texto manuscrito.',
      'Los elementos no textuales se describen entre corchetes: [Sello: …], [Firma ilegible], [Escudo: …], [ilegible].',
      'Los nombres propios de personas no se traducen. Los nombres de instituciones se dejan en el idioma original y, la primera vez, se agrega entre corchetes una traducción explicativa.',
      'Los números, las fechas, los importes y las unidades se transcriben tal como figuran: no se convierten ni se adaptan.',
      'Las figuras jurídicas sin equivalente en el otro ordenamiento se dejan en el idioma original en cursiva, con una explicación del traductor entre corchetes; nunca se sustituyen por una figura local que no sea la misma.',
      'Los errores del original se reproducen y se marcan con [sic]. No se corrigen.',
      'Se respeta la disposición del original: orden de los bloques, tablas, numeración de cláusulas y saltos de página.',
      'Cualquier aclaración propia va marcada como [N. del T.: …] y se reduce al mínimo indispensable.',
    ],
    esqueleto: ESQUELETO_PUBLICA,
    reglas: { ...REGLAS_BASE, maxGerundios100: 3, maxPasivas100: 2 },
    predefinido: true,
  },
  {
    id: 'juridica',
    nombre: 'Jurídica',
    descripcion:
      'Contratos, sentencias, dictámenes y normativa sin carácter de traducción pública.',
    registro: 'Formal, técnico-jurídico, preciso',
    instrucciones: [
      'Identificar el ordenamiento del original (common law o derecho continental) y no trasladar una figura a otra que solo se le parece.',
      'Cuando no exista equivalencia, usar el término del ordenamiento de destino más próximo y advertirlo, o conservar el original con una glosa. Siempre justificarlo.',
      'Respetar la terminología definida dentro del propio documento: si el contrato define «Parte Compradora», ese término se usa sin variantes en todo el texto.',
      'Mantener la numeración de cláusulas, considerandos y remisiones internas exactamente como en el original.',
      'El español jurídico admite períodos largos, pero no el calco sintáctico del inglés: hay que reordenar la frase.',
      'Las fórmulas rituales se traducen por su fórmula equivalente asentada, no palabra por palabra (whereas, hereinafter, in witness whereof, por ejemplo).',
      'Los shall del inglés jurídico se resuelven con presente de indicativo o con perífrasis de obligación según el caso, no con futuro sistemático.',
    ],
    esqueleto: `${ESQUELETO_CONTRATO}\n\n— — —\n\n${ESQUELETO_SENTENCIA}`,
    reglas: { ...REGLAS_BASE, maxPasivas100: 2 },
    predefinido: true,
  },
  {
    id: 'tecnico-cientifica',
    nombre: 'Técnico-científica',
    descripcion:
      'Artículos, informes, manuales, patentes y documentación de ingeniería o ciencias.',
    registro: 'Formal, impersonal, terminológicamente estricto',
    instrucciones: [
      'La consistencia terminológica está por encima de la variación estilística: un concepto, un término, en todo el documento.',
      'Respetar la nomenclatura normalizada del campo (unidades del SI, nomenclatura química, taxonomía, códigos de normas).',
      'Las unidades y los símbolos se escriben según la norma en español: espacio fino entre cifra y unidad, coma decimal cuando el destino lo exige.',
      'Las siglas se desarrollan la primera vez con la sigla entre paréntesis; después se usa solo la sigla.',
      'No traducir nombres de productos, software, genes, protocolos ni identificadores de norma.',
      'La impersonalidad se resuelve con «se» impersonal antes que con voz pasiva.',
    ],
    reglas: { ...REGLAS_BASE, maxPasivas100: 2 },
    predefinido: true,
  },
  {
    id: 'medica',
    nombre: 'Médica',
    descripcion:
      'Historias clínicas, consentimientos informados, prospectos, protocolos y literatura médica.',
    registro: 'Formal, clínico, sin ambigüedad',
    instrucciones: [
      'La precisión está por encima de la elegancia: en dosis, vías de administración, lateralidad y frecuencias no cabe interpretación.',
      'Distinguir el registro según el destinatario: el consentimiento informado y el prospecto van dirigidos al paciente y piden lenguaje llano.',
      'Usar la terminología de los repertorios asentados en español y evitar el falso amigo (severe no es «severo» sino «grave»; drug no siempre es «droga»).',
      'Los nombres de principios activos van en su denominación común internacional; los nombres comerciales no se traducen.',
      'Las abreviaturas clínicas del inglés se desarrollan si en español no están asentadas.',
    ],
    reglas: REGLAS_BASE,
    predefinido: true,
  },
  {
    id: 'financiera',
    nombre: 'Económico-financiera',
    descripcion: 'Estados contables, memorias, informes de auditoría y documentación bancaria.',
    registro: 'Formal, técnico-contable',
    instrucciones: [
      'Respetar la terminología del marco contable aplicable (NIIF/IFRS, US GAAP o el plan local) y no mezclar marcos.',
      'Las cifras, los separadores de miles y decimales y los signos de moneda se adaptan a la convención del idioma de destino, sin alterar el valor.',
      'No convertir monedas ni redondear importes.',
      'Los rubros de balance y de estado de resultados usan la denominación asentada, no una traducción libre.',
      'Los paréntesis que indican importes negativos se conservan.',
    ],
    reglas: { ...REGLAS_BASE, maxPasivas100: 2 },
    predefinido: true,
  },
  {
    id: 'academica',
    nombre: 'Académica',
    descripcion: 'Tesis, ponencias, artículos de humanidades y ciencias sociales.',
    registro: 'Formal, argumentativo',
    instrucciones: [
      'Conservar la arquitectura argumental: los conectores lógicos del original marcan el razonamiento y no se pueden diluir.',
      'Las citas textuales de obras con traducción publicada se toman de esa traducción y se indica; si no la hay, se traducen y se advierte.',
      'Las referencias bibliográficas no se traducen: se mantiene el título original.',
      'Los términos de un marco teórico concreto se respetan tal como los fijó ese marco.',
    ],
    reglas: REGLAS_BASE,
    predefinido: true,
  },
  {
    id: 'literaria',
    nombre: 'Literaria',
    descripcion: 'Narrativa, ensayo y textos donde la voz del autor es parte del contenido.',
    registro: 'El del original',
    instrucciones: [
      'La voz del autor manda: ritmo, longitud de frase, registro y recursos se reconstruyen, no se normalizan.',
      'El juego de palabras se recrea con un recurso equivalente en el idioma de destino aunque cambie la letra.',
      'Las marcas de oralidad, el dialecto y el idiolecto de cada personaje se sostienen a lo largo del texto.',
      'Está permitido apartarse de la literalidad todo lo que haga falta para conservar el efecto.',
    ],
    reglas: { ...REGLAS_BASE, maxGerundios100: 3, maxAdverbiosMenteDiezLineas: 2 },
    predefinido: true,
  },
  {
    id: 'localizacion',
    nombre: 'Localización y marketing',
    descripcion: 'Interfaces, sitios, campañas y material comercial.',
    registro: 'Cercano, directo, orientado a la acción',
    instrucciones: [
      'Se traduce la intención, no la letra: un eslogan se reescribe si es lo que hace falta.',
      'Los botones y las etiquetas de interfaz se resuelven con infinitivo o sustantivo, con criterio uniforme en todo el producto.',
      'Respetar los límites de longitud: en interfaz, el español no debería exceder en más de un 20 % al inglés.',
      'Adaptar formatos locales: fechas, horas, monedas, direcciones y tratamiento (tú/usted según el encargo).',
      'Las variables y los marcadores de posición ({nombre}, %s) se conservan intactos.',
    ],
    reglas: { ...REGLAS_BASE, maxGerundios100: 1 },
    predefinido: true,
  },
];

export function estiloPorDefecto(): EstiloTraduccion {
  return ESTILOS_PREDEFINIDOS[0];
}
