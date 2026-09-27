import type { EtiquetaId, Idioma, Severidad } from '../tipos';

/**
 * Repertorio de calcos, anglicismos y falsos amigos que se detectan por regla,
 * sin pasar por el modelo. Son los errores que se repiten en la traducción
 * del inglés y que conviene marcar siempre igual.
 *
 * `patron` es la fuente de una expresión regular; se compila con las banderas
 * «giu». Cuando se construye con `termino()` se le añaden límites de palabra
 * compatibles con tildes y eñes.
 */

export interface ReglaLexica {
  id: string;
  /** Idioma del texto sobre el que se aplica la regla. */
  idioma: Idioma;
  patron: string;
  etiqueta: EtiquetaId;
  severidad: Severidad;
  mensaje: string;
  sugerencia: string;
  /** Si el fragmento aparece dentro de alguno de estos contextos, no se marca. */
  excepciones?: string[];
}

const LIM_IZQ = '(?<![\\p{L}\\p{N}])';
const LIM_DER = '(?![\\p{L}\\p{N}])';

function termino(texto: string): string {
  return `${LIM_IZQ}${texto}${LIM_DER}`;
}

interface Entrada {
  id: string;
  forma: string;
  mensaje: string;
  sugerencia: string;
  severidad?: Severidad;
  etiqueta?: EtiquetaId;
  excepciones?: string[];
}

function construir(idioma: Idioma, entradas: Entrada[], etiquetaBase: EtiquetaId): ReglaLexica[] {
  return entradas.map((e) => ({
    id: e.id,
    idioma,
    patron: termino(e.forma),
    etiqueta: e.etiqueta ?? etiquetaBase,
    severidad: e.severidad ?? 'media',
    mensaje: e.mensaje,
    sugerencia: e.sugerencia,
    excepciones: e.excepciones,
  }));
}

/* ------------------------------------------------------------------ */
/* Calcos sintácticos y preposicionales en español                     */
/* ------------------------------------------------------------------ */

const CALCOS_ES: Entrada[] = [
  {
    id: 'en-base-a',
    forma: 'en base a',
    mensaje: 'Construcción no asentada, calcada del inglés.',
    sugerencia: 'sobre la base de · con base en · según · a partir de',
    severidad: 'media',
  },
  {
    id: 'de-acuerdo-a',
    forma: 'de acuerdo a',
    mensaje: 'El régimen correcto es «de acuerdo con».',
    sugerencia: 'de acuerdo con · conforme a · según',
    severidad: 'media',
  },
  {
    id: 'en-relacion-a',
    forma: 'en relaci[óo]n a',
    mensaje: 'Cruce de «en relación con» y «con relación a».',
    sugerencia: 'en relación con · con relación a · respecto de',
    severidad: 'media',
  },
  {
    id: 'bajo-la-ley',
    forma: 'bajo (la|el|los|las) (ley|leyes|c[óo]digo|contrato|acuerdo|convenio|reglamento)',
    mensaje: 'Calco de «under the law / under the contract».',
    sugerencia: 'conforme a · en virtud de · con arreglo a · según',
    severidad: 'alta',
  },
  {
    id: 'bajo-circunstancias',
    forma: 'bajo (estas|esas|ciertas|las|dichas) circunstancias',
    mensaje: 'Calco de «under these circumstances».',
    sugerencia: 'en estas circunstancias · en tales circunstancias',
    severidad: 'media',
  },
  {
    id: 'bajo-punto-de-vista',
    forma: 'bajo (el|este|ese) punto de vista',
    mensaje: 'El punto de vista es «desde», no «bajo».',
    sugerencia: 'desde el punto de vista',
    severidad: 'media',
  },
  {
    id: 'en-el-evento-de-que',
    forma: 'en el evento de que',
    mensaje: 'Calco de «in the event that».',
    sugerencia: 'en caso de que · si',
    severidad: 'alta',
  },
  {
    id: 'provisto-que',
    forma: 'provisto que',
    mensaje: 'Calco de «provided that».',
    sugerencia: 'siempre que · a condición de que · salvo que',
    severidad: 'alta',
  },
  {
    id: 'a-ser-determinado',
    forma: 'a ser (determinad[oa]s?|definid[oa]s?|acordad[oa]s?|confirmad[oa]s?)',
    mensaje: 'Calco de «to be determined».',
    sugerencia: 'por determinar · pendiente de acuerdo',
    severidad: 'media',
  },
  {
    id: 'jugar-un-rol',
    forma: 'jug(ar|ó|aron|aba|ando|ará|ar[íi]a)n? un (rol|papel)',
    mensaje: 'Calco de «to play a role».',
    sugerencia: 'desempeñar un papel · cumplir una función · tener un papel',
    severidad: 'media',
  },
  {
    id: 'tomar-accion',
    forma: 'tom(ar|ó|aron|a|an|ando) acci[óo]n',
    mensaje: 'Calco de «to take action».',
    sugerencia: 'actuar · adoptar medidas · tomar medidas',
    severidad: 'media',
  },
  {
    id: 'tomar-lugar',
    forma: 'tom(ar|ó|aron|a|an) lugar',
    mensaje: 'Calco de «to take place».',
    sugerencia: 'tener lugar · celebrarse · producirse · ocurrir',
    severidad: 'alta',
  },
  {
    id: 'hacer-sentido',
    forma: 'hac(er|e|en|[íi]a) sentido',
    mensaje: 'Calco de «to make sense».',
    sugerencia: 'tener sentido',
    severidad: 'alta',
  },
  {
    id: 'hacer-una-diferencia',
    forma: 'hac(er|e|en) una diferencia',
    mensaje: 'Calco de «to make a difference».',
    sugerencia: 'marcar la diferencia · ser determinante',
    severidad: 'media',
  },
  {
    id: 'aplicar-para',
    forma: 'aplic(ar|ó|[óo]|a|an|aron) (para|a) (un|una|el|la|los|las)? ?(puesto|trabajo|beca|empleo|programa|vacante)',
    mensaje: 'Calco de «to apply for»: en español se postula o se solicita.',
    sugerencia: 'postularse a · presentarse a · solicitar',
    severidad: 'media',
  },
  {
    id: 'resultando-en',
    forma: 'resultando en',
    mensaje: 'Calco de «resulting in», además de gerundio de consecuencia.',
    sugerencia: 'lo que da lugar a · con el resultado de · de lo que se sigue',
    severidad: 'alta',
  },
  {
    id: 'esta-siendo',
    forma: 'est[áa](n)? siendo \\p{L}+[ai]d[oa]s?',
    mensaje: 'Pasiva progresiva calcada del inglés.',
    sugerencia: 'Usar activa o «se» impersonal: «se examina», «el tribunal examina».',
    severidad: 'alta',
  },
  {
    id: 'en-adicion-a',
    forma: 'en adici[óo]n a',
    mensaje: 'Calco de «in addition to».',
    sugerencia: 'además de · junto con · sumado a',
    severidad: 'media',
  },
  {
    id: 'y-o',
    forma: 'y/o',
    mensaje: 'Fórmula calcada de «and/or»; en español la «o» ya es inclusiva.',
    sugerencia: 'o · o ambos · según el caso',
    severidad: 'baja',
  },
  {
    id: 'previo-a',
    forma: 'previo a',
    mensaje: 'Calco de «prior to» en función de locución preposicional.',
    sugerencia: 'antes de · con anterioridad a',
    severidad: 'baja',
  },
  {
    id: 'el-mismo-anaforico',
    forma: '(de|a|con|por|para|en) (el|la) mism[oa]s?',
    mensaje: 'Uso anafórico de «el mismo» en lugar de un pronombre o del sustantivo.',
    sugerencia: 'Repetir el sustantivo o usar un posesivo: «su contenido» en vez de «el contenido del mismo».',
    severidad: 'media',
    etiqueta: 'redaccion',
  },
  {
    id: 'tan-pronto-como-posible',
    forma: 'tan pronto como (sea )?posible',
    mensaje: 'Calco de «as soon as possible».',
    sugerencia: 'cuanto antes · a la mayor brevedad · lo antes posible',
    severidad: 'baja',
  },
  {
    id: 'durante-el-termino-de',
    forma: 'durante el t[ée]rmino de',
    mensaje: '«Term» aquí es plazo o vigencia, no término.',
    sugerencia: 'durante el plazo de · durante la vigencia de',
    severidad: 'alta',
  },
  {
    id: 'es-por-eso-que',
    forma: 'es por (eso|ello|esto) que',
    mensaje: 'Galicismo/anglicismo de relativo («that is why»).',
    sugerencia: 'por eso · por ello · esa es la razón por la que',
    severidad: 'baja',
  },
];

/* ------------------------------------------------------------------ */
/* Falsos amigos y anglicismos léxicos en español                      */
/* ------------------------------------------------------------------ */

const FALSOS_AMIGOS_ES: Entrada[] = [
  {
    id: 'fa-severo',
    forma: 'sever[oa]s?',
    mensaje: 'Falso amigo de «severe»: en español «severo» es riguroso con la disciplina.',
    sugerencia: 'grave · intenso · fuerte (según el caso)',
    severidad: 'alta',
  },
  {
    id: 'fa-remover',
    forma: 'remov(er|i[óo]|ieron|emos|erse)',
    mensaje: 'Falso amigo de «remove»: «remover» es agitar o revolver.',
    sugerencia: 'quitar · retirar · eliminar · destituir · suprimir',
    severidad: 'alta',
  },
  {
    id: 'fa-asumir',
    forma: 'asum(o|e|imos|en|ir|iendo|ió) que',
    mensaje: 'Falso amigo de «assume»: «asumir» es hacerse cargo.',
    sugerencia: 'suponer que · dar por supuesto que · partir de la base de que',
    severidad: 'media',
  },
  {
    id: 'fa-eventualmente',
    forma: 'eventualmente',
    mensaje: 'Falso amigo de «eventually»: en español significa «de forma ocasional».',
    sugerencia: 'con el tiempo · finalmente · a la larga · llegado el caso',
    severidad: 'alta',
  },
  {
    id: 'fa-actualmente',
    forma: 'actualmente',
    mensaje:
      'Revisar si traduce «actually» (en realidad) y no «currently» (en la actualidad).',
    sugerencia: 'en realidad · en rigor · hoy en día (según el original)',
    severidad: 'baja',
    etiqueta: 'revisar-termino',
  },
  {
    id: 'fa-ultimamente',
    forma: '[úu]ltimamente',
    mensaje: 'Revisar si traduce «ultimately» (en definitiva) y no «lately».',
    sugerencia: 'en definitiva · en última instancia · a fin de cuentas',
    severidad: 'media',
  },
  {
    id: 'fa-consistente',
    forma: 'consistente(s)? con',
    mensaje: 'Falso amigo de «consistent with».',
    sugerencia: 'coherente con · acorde con · compatible con · conforme a',
    severidad: 'media',
  },
  {
    id: 'fa-sensible',
    forma: 'sensible(s)?',
    mensaje: 'Revisar si traduce «sensible» (sensato) o «sensitive» (delicado, confidencial).',
    sugerencia: 'sensato · razonable · delicado · confidencial (según el caso)',
    severidad: 'baja',
    etiqueta: 'revisar-termino',
  },
  {
    id: 'fa-dramatico',
    forma: 'dram[áa]tic[oa]s?',
    mensaje: 'Falso amigo de «dramatic» en el sentido de magnitud.',
    sugerencia: 'drástico · notable · espectacular · pronunciado',
    severidad: 'media',
  },
  {
    id: 'fa-domestico',
    forma: 'dom[ée]stic[oa]s?',
    mensaje: 'Falso amigo de «domestic» cuando significa nacional o interno.',
    sugerencia: 'nacional · interno · del país',
    severidad: 'media',
  },
  {
    id: 'fa-sofisticado',
    forma: 'sofisticad[oa]s?',
    mensaje: 'Falso amigo de «sophisticated»: en español arrastra la idea de artificioso.',
    sugerencia: 'complejo · avanzado · refinado · elaborado',
    severidad: 'baja',
  },
  {
    id: 'fa-agresivo',
    forma: 'agresiv[oa]s?',
    mensaje: 'Falso amigo de «aggressive» aplicado a planes, metas o plazos.',
    sugerencia: 'ambicioso · enérgico · exigente · audaz',
    severidad: 'media',
  },
  {
    id: 'fa-billon',
    forma: 'bill[óo]n(es)?',
    mensaje:
      'Cifra crítica: el «billion» inglés son mil millones; el billón español es un millón de millones.',
    sugerencia: 'mil millones (si el original dice «billion»)',
    severidad: 'alta',
    etiqueta: 'numero-fecha',
  },
  {
    id: 'fa-trillon',
    forma: 'trill[óo]n(es)?',
    mensaje: 'El «trillion» inglés es un billón español.',
    sugerencia: 'billón (si el original dice «trillion»)',
    severidad: 'alta',
    etiqueta: 'numero-fecha',
  },
  {
    id: 'fa-topico',
    forma: 't[óo]pic[oa]s?',
    mensaje: 'Falso amigo de «topic»: en español un tópico es un lugar común.',
    sugerencia: 'tema · asunto · cuestión',
    severidad: 'media',
  },
  {
    id: 'fa-librería',
    forma: 'librer[íi]as?',
    mensaje: 'Falso amigo de «library» en contextos informáticos.',
    sugerencia: 'biblioteca',
    severidad: 'media',
  },
  {
    id: 'fa-soportar',
    forma: 'soport(a|an|ar|ado|ada) (el|la|los|las|un|una)',
    mensaje: 'Falso amigo de «to support»: «soportar» es aguantar.',
    sugerencia: 'admitir · ser compatible con · permitir · respaldar',
    severidad: 'media',
  },
  {
    id: 'fa-reportar',
    forma: 'report(ar|ó|aron|a|an|ando)',
    mensaje: 'Anglicismo de «to report» en el sentido de comunicar.',
    sugerencia: 'informar · comunicar · notificar · dar parte de',
    severidad: 'baja',
  },
  {
    id: 'fa-alegadamente',
    forma: 'alegadamente',
    mensaje: 'Calco de «allegedly»; no está asentado en español.',
    sugerencia: 'presuntamente · supuestamente · según se alega',
    severidad: 'alta',
  },
  {
    id: 'fa-elegible',
    forma: 'elegible(s)? para',
    mensaje: 'Calco de «eligible for»: en español «elegible» es «que puede ser elegido».',
    sugerencia: 'que reúne los requisitos para · con derecho a · apto para',
    severidad: 'media',
  },
  {
    id: 'fa-instancia',
    forma: 'por instancia',
    mensaje: 'Calco de «for instance».',
    sugerencia: 'por ejemplo · pongamos por caso',
    severidad: 'alta',
  },
];

/* ------------------------------------------------------------------ */
/* Falsos amigos jurídicos (inglés → español)                          */
/* ------------------------------------------------------------------ */

const JURIDICOS_ES: Entrada[] = [
  {
    id: 'ju-corte',
    forma: 'la corte|las cortes',
    mensaje:
      'En español peninsular y en gran parte de América, «court» es tribunal o juzgado; «corte» solo en ciertos usos (Corte Suprema, Corte Penal Internacional).',
    sugerencia: 'el tribunal · el juzgado · la sala',
    severidad: 'media',
    etiqueta: 'revisar-contexto',
  },
  {
    id: 'ju-evidencia',
    forma: 'evidencias?',
    mensaje: 'Falso amigo de «evidence» en contexto procesal.',
    sugerencia: 'prueba · pruebas · elementos de prueba · material probatorio',
    severidad: 'alta',
  },
  {
    id: 'ju-ofensa',
    forma: 'ofensas?',
    mensaje: 'Falso amigo de «offence/offense».',
    sugerencia: 'delito · infracción · contravención',
    severidad: 'alta',
  },
  {
    id: 'ju-felonia',
    forma: 'felon[íi]as?',
    mensaje: 'Calco de «felony»; en español «felonía» es deslealtad.',
    sugerencia: 'delito grave · delito mayor [felony]',
    severidad: 'alta',
  },
  {
    id: 'ju-acta-ley',
    forma: 'acta de \\p{Lu}',
    mensaje: 'Revisar si «Act» se tradujo por «acta» en lugar de «ley».',
    sugerencia: 'Ley de … · Ley sobre …',
    severidad: 'alta',
  },
  {
    id: 'ju-ejecutar-contrato',
    forma: 'ejecut(ar|ó|aron|ado|ada) (el|un|este|los) (contrato|acuerdo|convenio|instrumento)',
    mensaje:
      '«To execute a contract» es otorgarlo o firmarlo; «ejecutar un contrato» en español es exigir su cumplimiento forzoso.',
    sugerencia: 'otorgar · celebrar · suscribir · firmar',
    severidad: 'alta',
  },
  {
    id: 'ju-provision',
    forma: 'provisi(ón|on|ones)',
    mensaje: 'Falso amigo de «provision» en un contrato o una ley.',
    sugerencia: 'disposición · cláusula · estipulación · precepto',
    severidad: 'alta',
  },
  {
    id: 'ju-consideracion',
    forma: 'consideraci[óo]n (contractual|del contrato)',
    mensaje: '«Consideration» del common law no es «consideración».',
    sugerencia: 'contraprestación · causa contractual [consideration]',
    severidad: 'alta',
    etiqueta: 'sin-equivalente-exacto',
  },
  {
    id: 'ju-mocion',
    forma: 'moci(ón|on|ones)',
    mensaje: 'Falso amigo de «motion» procesal.',
    sugerencia: 'petición · escrito · solicitud · recurso',
    severidad: 'alta',
  },
  {
    id: 'ju-sostuvo',
    forma: '(el|la) (tribunal|corte|juzgado|sala|juez|jueza) sostuvo',
    mensaje: '«The court held» se resuelve con un verbo de resolución.',
    sugerencia: 'resolvió · declaró · sentó · estimó · falló',
    severidad: 'media',
  },
  {
    id: 'ju-danos-punitivos',
    forma: 'daños punitivos',
    mensaje:
      'Figura propia del common law: en el derecho continental no existe con ese alcance.',
    sugerencia: 'daños punitivos [punitive damages] con nota del traductor',
    severidad: 'media',
    etiqueta: 'sin-equivalente-exacto',
  },
  {
    id: 'ju-estatuto',
    forma: 'estatutos? (federal|estatal|de)',
    mensaje: 'Revisar si «statute» se volvió «estatuto» en lugar de «ley».',
    sugerencia: 'ley · norma legal · texto legal',
    severidad: 'media',
  },
];

/* ------------------------------------------------------------------ */
/* Anglicismos crudos con equivalente asentado                         */
/* ------------------------------------------------------------------ */

const PRESTAMOS_ES: Entrada[] = [
  { id: 'pr-performance', forma: 'performance', mensaje: 'Préstamo evitable.', sugerencia: 'rendimiento · desempeño · actuación' },
  { id: 'pr-feedback', forma: 'feedback', mensaje: 'Préstamo evitable.', sugerencia: 'comentarios · devolución · observaciones' },
  { id: 'pr-deadline', forma: 'deadline', mensaje: 'Préstamo evitable.', sugerencia: 'plazo · fecha límite · vencimiento' },
  { id: 'pr-target', forma: 'target', mensaje: 'Préstamo evitable.', sugerencia: 'objetivo · meta · público destinatario' },
  { id: 'pr-staff', forma: 'staff', mensaje: 'Préstamo evitable.', sugerencia: 'personal · plantilla · equipo' },
  { id: 'pr-stock', forma: 'stock', mensaje: 'Préstamo evitable.', sugerencia: 'existencias · inventario' },
  { id: 'pr-link', forma: 'links?', mensaje: 'Préstamo evitable.', sugerencia: 'enlace · vínculo' },
  { id: 'pr-email', forma: '(e-?mail|mail)s?', mensaje: 'Préstamo evitable.', sugerencia: 'correo electrónico · correo' },
  { id: 'pr-compliance', forma: 'compliance', mensaje: 'Préstamo evitable.', sugerencia: 'cumplimiento normativo' },
  { id: 'pr-leasing', forma: 'leasing', mensaje: 'Préstamo con equivalente en español.', sugerencia: 'arrendamiento financiero' },
  { id: 'pr-ratio', forma: 'ratios?', mensaje: 'Préstamo evitable.', sugerencia: 'razón · relación · cociente · índice' },
  { id: 'pr-testear', forma: 'test(ear|ea|earon|eado)', mensaje: 'Préstamo evitable.', sugerencia: 'probar · ensayar · poner a prueba' },
  { id: 'pr-setear', forma: 'set(ear|ea|earon|eado)', mensaje: 'Préstamo evitable.', sugerencia: 'configurar · fijar · establecer' },
  { id: 'pr-customizar', forma: 'customiz(ar|a|ado|ada)', mensaje: 'Préstamo evitable.', sugerencia: 'personalizar · adaptar' },
  { id: 'pr-accesar', forma: 'acces(ar|a|aron|ado)', mensaje: 'Forma no admitida.', sugerencia: 'acceder a · entrar en' },
  { id: 'pr-monitorear', forma: 'monitore(ar|a|ado|o)', mensaje: 'Préstamo con alternativas más precisas.', sugerencia: 'supervisar · seguir · controlar · vigilar', severidad: 'baja' },
  { id: 'pr-implementar', forma: 'implement(ar|a|ado|ación)', mensaje: 'Admitido, pero suele haber una forma más natural.', sugerencia: 'aplicar · poner en práctica · ejecutar · establecer', severidad: 'baja' },
];

/* ------------------------------------------------------------------ */
/* Interferencias del español cuando el destino es inglés              */
/* ------------------------------------------------------------------ */

const INTERFERENCIAS_EN: Entrada[] = [
  { id: 'en-according-with', forma: 'according with', mensaje: 'Régimen incorrecto.', sugerencia: 'according to', severidad: 'alta' },
  { id: 'en-depends-of', forma: 'depends? of', mensaje: 'Régimen incorrecto.', sugerencia: 'depend(s) on', severidad: 'alta' },
  { id: 'en-consist-in', forma: 'consists? in', mensaje: 'Régimen incorrecto.', sugerencia: 'consist(s) of · consist(s) in (solo para «radicar en»)', severidad: 'media' },
  { id: 'en-responsible-of', forma: 'responsible of', mensaje: 'Régimen incorrecto.', sugerencia: 'responsible for', severidad: 'alta' },
  { id: 'en-in-relation-with', forma: 'in relation with', mensaje: 'Régimen incorrecto.', sugerencia: 'in relation to · in connection with', severidad: 'media' },
  { id: 'en-informations', forma: 'informations', mensaje: 'Incontable en inglés.', sugerencia: 'information', severidad: 'alta' },
  { id: 'en-advices', forma: 'advices', mensaje: 'Incontable en inglés.', sugerencia: 'advice · pieces of advice', severidad: 'alta' },
  { id: 'en-evidences', forma: 'evidences', mensaje: 'Normalmente incontable en contexto procesal.', sugerencia: 'evidence', severidad: 'alta' },
  { id: 'en-actually', forma: 'in the actuality', mensaje: 'Calco de «en la actualidad».', sugerencia: 'currently · at present · today', severidad: 'alta' },
  { id: 'en-assist-to', forma: 'assist(ed)? to the', mensaje: 'Calco de «asistir a».', sugerencia: 'attend', severidad: 'alta' },
  { id: 'en-realize-study', forma: 'realiz(e|ed) (a|the) (study|analysis|survey|research)', mensaje: 'Calco de «realizar».', sugerencia: 'carry out · conduct · perform', severidad: 'alta' },
  { id: 'en-make-a-question', forma: 'mak(e|es|ing) a question', mensaje: 'Calco de «hacer una pregunta».', sugerencia: 'ask a question', severidad: 'alta' },
  { id: 'en-since-years', forma: 'since \\d+ years', mensaje: 'Calco de «desde hace X años».', sugerencia: 'for X years', severidad: 'alta' },
  { id: 'en-during-years', forma: 'during \\d+ years', mensaje: 'Calco de «durante X años».', sugerencia: 'for X years', severidad: 'media' },
  { id: 'en-has-years', forma: 'has \\d+ years old', mensaje: 'Calco de «tener X años».', sugerencia: 'is X years old', severidad: 'alta' },
  { id: 'en-the-same', forma: 'of the same(?= [,.])', mensaje: 'Calco anafórico de «del mismo».', sugerencia: 'thereof · its · repetir el sustantivo', severidad: 'media' },
  { id: 'en-explain-me', forma: 'explain me', mensaje: 'Falta la preposición.', sugerencia: 'explain to me', severidad: 'alta' },
  { id: 'en-in-base-to', forma: 'in base to', mensaje: 'Calco de «en base a».', sugerencia: 'based on · on the basis of', severidad: 'alta' },
];

export const REGLAS_LEXICAS: ReglaLexica[] = [
  ...construir('es', CALCOS_ES, 'posible-calco'),
  ...construir('es', FALSOS_AMIGOS_ES, 'posible-calco'),
  ...construir('es', JURIDICOS_ES, 'posible-calco'),
  ...construir('es', PRESTAMOS_ES, 'anglicismo'),
  ...construir('en', INTERFERENCIAS_EN, 'posible-calco'),
];

export function reglasPara(idioma: Idioma): ReglaLexica[] {
  return REGLAS_LEXICAS.filter((r) => r.idioma === idioma);
}
