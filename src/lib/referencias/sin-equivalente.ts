import type { Idioma } from '../tipos';

/**
 * Términos que no tienen equivalente exacto en el otro idioma porque designan
 * una figura propia de un ordenamiento o de una cultura administrativa.
 *
 * Se usan para dos cosas: marcar el término en el texto fuente antes de
 * traducir y dar al motor la información con la que justificar la elección.
 */

export interface TerminoSinEquivalente {
  termino: string;
  idioma: Idioma;
  sistema: 'common-law' | 'civil-law' | 'administrativo' | 'general';
  ambito: string;
  explicacion: string;
  /** Estrategias de traducción, de la más recomendable a la menos. */
  estrategias: string[];
  fuentes: string[];
  /** Variantes ortográficas o formas flexionadas que también se detectan. */
  variantes?: string[];
}

export const SIN_EQUIVALENTE: TerminoSinEquivalente[] = [
  /* ------------------------- Common law → español ------------------------ */
  {
    termino: 'consideration',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho contractual',
    explicacion:
      'Requisito de validez del contrato en el common law: cada parte debe dar o prometer algo de valor. El derecho continental no lo exige; su función la cumplen la causa y el objeto, que no coinciden con ella.',
    estrategias: [
      'Mantener «consideration» en cursiva con glosa entre corchetes la primera vez.',
      'Traducir por «contraprestación» cuando el contexto sea puramente económico y no doctrinal.',
      'En traducción pública, conservar el término y explicar en nota del traductor.',
    ],
    fuentes: ['Restatement (Second) of Contracts, § 71', 'Black’s Law Dictionary, s. v. consideration'],
  },
  {
    termino: 'estoppel',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal y contractual',
    explicacion:
      'Impedimento de contradecir los propios actos. La doctrina de los actos propios cumple una función parecida en el derecho continental, pero su alcance y sus requisitos no son los mismos.',
    estrategias: [
      'Conservar «estoppel» en cursiva con glosa.',
      'Usar «doctrina de los actos propios» solo cuando el contexto permita la aproximación y advertirlo.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. estoppel', 'Doctrina: venire contra factum proprium'],
  },
  {
    termino: 'equity',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Sistema de fuentes',
    explicacion:
      'Cuerpo de normas y remedios nacido de la Court of Chancery, paralelo al common law estricto. No es la «equidad» del artículo del Código Civil, que es un criterio de aplicación de la norma.',
    estrategias: [
      'Traducir por «equity» con glosa, o por «derecho de equidad» cuando se refiera al sistema.',
      'Reservar «equidad» para los casos en que el texto aluda al criterio de justicia del caso concreto.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. equity'],
  },
  {
    termino: 'trust',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho patrimonial',
    explicacion:
      'Desdoblamiento de la propiedad entre trustee (titular formal) y beneficiary (titular económico). El derecho continental no admite ese desdoblamiento; el fideicomiso latinoamericano se le aproxima pero no coincide.',
    estrategias: [
      'Conservar «trust» con glosa la primera vez.',
      'Usar «fideicomiso» cuando el destino sea un país que lo regula y el contexto lo admita, con advertencia.',
    ],
    fuentes: ['Convenio de La Haya de 1985 sobre la ley aplicable al trust', 'Black’s Law Dictionary'],
    variantes: ['trustee', 'settlor', 'cestui que trust'],
  },
  {
    termino: 'tort',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Responsabilidad civil',
    explicacion:
      'Categoría de ilícito civil no contractual, organizada por tipos nominados (negligence, nuisance, trespass). El derecho continental parte de una cláusula general de responsabilidad extracontractual.',
    estrategias: [
      'Traducir por «ilícito civil» o «responsabilidad extracontractual» según el contexto.',
      'Conservar el nombre del tort concreto entre corchetes cuando importe la categoría.',
    ],
    fuentes: ['Restatement (Second) of Torts', 'Black’s Law Dictionary, s. v. tort'],
  },
  {
    termino: 'discovery',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Fase previa al juicio en la que las partes se intercambian pruebas de forma obligatoria y con alcance muy amplio. No hay fase equivalente en el proceso civil continental.',
    estrategias: [
      'Conservar «discovery» en cursiva con glosa.',
      'Describirlo como «fase de exhibición y producción de prueba» cuando haga falta explicarlo.',
    ],
    fuentes: ['Federal Rules of Civil Procedure, reglas 26 a 37'],
  },
  {
    termino: 'misdemeanor',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho penal',
    explicacion:
      'Delito de menor gravedad, con pena habitualmente inferior a un año. La línea con «felony» no coincide con la división española entre delito leve, menos grave y grave.',
    estrategias: [
      'Traducir por «delito menor» o «delito de menor gravedad» y añadir el término inglés entre corchetes.',
      'Evitar «falta» y «contravención», que remiten a categorías locales distintas.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. misdemeanor'],
  },
  {
    termino: 'felony',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho penal',
    explicacion:
      'Delito grave, castigado con pena privativa de libertad superior a un año. El corte por duración de la pena no existe como tal en el derecho continental.',
    estrategias: [
      'Traducir por «delito grave» con el término inglés entre corchetes.',
      'Nunca «felonía», que en español significa deslealtad.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. felony'],
  },
  {
    termino: 'affidavit',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Declaración escrita hecha bajo juramento ante un funcionario habilitado, con valor probatorio propio. La declaración jurada hispanoamericana se le parece pero sus requisitos formales varían.',
    estrategias: [
      'Traducir por «declaración jurada» y conservar «affidavit» entre corchetes.',
      'En traducción pública, mantener el término y describir la fórmula de juramento.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. affidavit'],
  },
  {
    termino: 'deed',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho inmobiliario',
    explicacion:
      'Documento solemne, firmado y entregado, que transmite un derecho real. No requiere notario en el sentido latino; su equivalencia con la escritura pública es parcial.',
    estrategias: [
      'Traducir por «escritura» o «título de propiedad» según el contexto, con advertencia.',
      'Conservar «deed» cuando el texto contraste deed con otros instrumentos.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. deed'],
  },
  {
    termino: 'injunction',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Orden judicial de hacer o no hacer, nacida en equity. Cubre a la vez lo que en derecho continental serían medidas cautelares y condenas de hacer o no hacer.',
    estrategias: [
      'Traducir por «medida cautelar», «mandamiento judicial» u «orden de cese» según lo que haga en el texto.',
      'Precisar el subtipo (preliminary, permanent, interlocutory) porque cambia el equivalente.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. injunction'],
  },
  {
    termino: 'solicitor',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Profesiones jurídicas',
    explicacion:
      'En el Reino Unido, abogado que asesora y prepara el caso, frente al barrister que litiga ante los tribunales superiores. La profesión de abogado hispanoamericana no está dividida.',
    estrategias: [
      'Conservar «solicitor» y «barrister» con glosa la primera vez.',
      'Evitar «procurador», que designa una figura distinta.',
    ],
    fuentes: ['Solicitors Act 1974 (Reino Unido)'],
    variantes: ['barrister'],
  },
  {
    termino: 'punitive damages',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Responsabilidad civil',
    explicacion:
      'Indemnización que excede el daño sufrido y persigue castigar y disuadir. El derecho continental limita la indemnización al daño efectivamente causado.',
    estrategias: [
      'Traducir por «daños punitivos» con nota del traductor sobre su carácter ajeno al ordenamiento de destino.',
      'Evitar «indemnización ejemplar» salvo que el original diga exemplary damages.',
    ],
    fuentes: ['Restatement (Second) of Torts, § 908'],
    variantes: ['exemplary damages'],
  },
  {
    termino: 'specific performance',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho contractual',
    explicacion:
      'Remedio de equity, excepcional en el common law, que obliga a cumplir el contrato en sus propios términos. En derecho continental el cumplimiento en especie es la regla, no la excepción.',
    estrategias: [
      'Traducir por «cumplimiento específico» o «cumplimiento en especie».',
      'Advertir que su carácter excepcional es rasgo del sistema de origen.',
    ],
    fuentes: ['Restatement (Second) of Contracts, § 359'],
  },
  {
    termino: 'grand jury',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal penal',
    explicacion:
      'Jurado que decide si hay mérito para acusar, sin pronunciarse sobre la culpabilidad. No existe en los sistemas continentales, donde esa función es del juez de instrucción o del fiscal.',
    estrategias: [
      'Conservar «gran jurado» con glosa explicativa.',
      'Nunca asimilarlo al jurado de juicio ni al juez de instrucción.',
    ],
    fuentes: ['Quinta Enmienda de la Constitución de los Estados Unidos'],
  },
  {
    termino: 'plea bargain',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal penal',
    explicacion:
      'Acuerdo por el que el acusado se declara culpable a cambio de una reducción de cargos o de pena. La conformidad española y el juicio abreviado latinoamericano solo se le aproximan.',
    estrategias: [
      'Traducir por «acuerdo de declaración de culpabilidad» o «negociación de la pena».',
      'Advertir si el destino conoce una figura local con requisitos distintos.',
    ],
    fuentes: ['Federal Rules of Criminal Procedure, regla 11'],
  },
  {
    termino: 'escrow',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Contratación',
    explicacion:
      'Depósito de fondos o documentos en manos de un tercero que los entrega al cumplirse una condición. El depósito en garantía continental no reproduce todas sus funciones.',
    estrategias: [
      'Traducir por «depósito en garantía» o «cuenta de depósito en garantía», con el término inglés entre corchetes.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. escrow'],
  },
  {
    termino: 'fee simple',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho inmobiliario',
    explicacion:
      'Estate de máxima amplitud y duración indefinida. Se aproxima al dominio pleno, pero la doctrina de los estates no tiene paralelo continental.',
    estrategias: [
      'Traducir por «dominio pleno» o «pleno dominio» con el término inglés entre corchetes.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. fee simple'],
    variantes: ['leasehold', 'freehold'],
  },
  {
    termino: 'probate',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Sucesiones',
    explicacion:
      'Procedimiento judicial de verificación del testamento y administración de la herencia por un personal representative. En derecho continental la herencia se defiere sin ese trámite.',
    estrategias: [
      'Traducir por «procedimiento sucesorio» o «legalización del testamento» con glosa.',
      'Evitar «testamentaría» sin advertencia: el trámite no coincide.',
    ],
    fuentes: ['Uniform Probate Code'],
  },
  {
    termino: 'subpoena',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Orden judicial de comparecer o de aportar documentos, con apercibimiento. La citación continental no siempre lleva el mismo apremio.',
    estrategias: [
      'Traducir por «citación judicial» o «requerimiento de exhibición» según el subtipo.',
      'Precisar subpoena ad testificandum frente a subpoena duces tecum.',
    ],
    fuentes: ['Federal Rules of Civil Procedure, regla 45'],
  },
  {
    termino: 'hearsay',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho probatorio',
    explicacion:
      'Prueba de referencia, inadmisible salvo excepción tasada. El derecho continental la admite con libre valoración, de modo que la regla no se traslada.',
    estrategias: [
      'Traducir por «prueba de referencia» o «testimonio de oídas» con glosa.',
    ],
    fuentes: ['Federal Rules of Evidence, regla 801'],
  },
  {
    termino: 'due process',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho constitucional',
    explicacion:
      'Garantía constitucional con vertiente procesal y sustantiva. La tutela judicial efectiva y el debido proceso hispanoamericano cubren la primera, no siempre la segunda.',
    estrategias: [
      'Traducir por «debido proceso» y advertir la vertiente sustantiva cuando el texto la invoque.',
    ],
    fuentes: ['Enmiendas V y XIV de la Constitución de los Estados Unidos'],
  },
  {
    termino: 'class action',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Demanda colectiva en la que el representante actúa por todo un grupo, que queda vinculado salvo que se excluya. Las acciones colectivas continentales suelen requerir adhesión expresa.',
    estrategias: [
      'Traducir por «acción colectiva» o «demanda de clase» con glosa sobre el régimen de exclusión.',
    ],
    fuentes: ['Federal Rules of Civil Procedure, regla 23'],
  },
  {
    termino: 'notary public',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Fe pública',
    explicacion:
      'En los países del common law se limita a identificar al firmante y tomar juramento; no redacta ni da fe del contenido, como sí hace el notario latino.',
    estrategias: [
      'Traducir por «notary public» conservado, o por «fedatario» con nota.',
      'Evitar «notario» a secas: induce a error sobre el alcance de su intervención.',
    ],
    fuentes: ['Uniform Law on Notarial Acts'],
  },
  {
    termino: 'contempt of court',
    idioma: 'en',
    sistema: 'common-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Desacato que el propio tribunal sanciona de inmediato, incluso con prisión. En derecho continental la desobediencia suele derivar en un proceso penal separado.',
    estrategias: [
      'Traducir por «desacato al tribunal» y advertir la potestad sancionadora directa.',
    ],
    fuentes: ['Black’s Law Dictionary, s. v. contempt'],
  },

  /* ------------------------- Español → inglés ---------------------------- */
  {
    termino: 'amparo',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho constitucional',
    explicacion:
      'Acción constitucional de tutela urgente de derechos fundamentales, propia de América Latina y España. No hay un writ único que la reproduzca.',
    estrategias: [
      'Conservar «amparo» en cursiva con glosa: constitutional relief for the protection of fundamental rights.',
      'Evitar «injunction» y «habeas corpus», que designan otra cosa.',
    ],
    fuentes: ['Ley de Amparo (México)', 'Ley Orgánica 2/1979 del Tribunal Constitucional (España)'],
  },
  {
    termino: 'fuero',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho procesal y constitucional',
    explicacion:
      'Según el contexto: competencia territorial o material, privilegio procesal de ciertos cargos, o cuerpo normativo histórico. Ninguna acepción tiene un término inglés único.',
    estrategias: [
      'Desambiguar por contexto: jurisdiction, venue, special procedural immunity, charter.',
      'Marcar siempre como dependiente del contexto.',
    ],
    fuentes: ['Diccionario panhispánico del español jurídico, s. v. fuero'],
  },
  {
    termino: 'juzgado de instrucción',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho procesal penal',
    explicacion:
      'Órgano judicial que dirige la investigación penal. El common law no conoce el juez instructor: la investigación corresponde a policía y fiscalía.',
    estrategias: [
      'Conservar el término con glosa: examining magistrate’s court / investigating court.',
      'Evitar «grand jury» y «preliminary hearing» como equivalentes.',
    ],
    fuentes: ['Ley de Enjuiciamiento Criminal (España)'],
  },
  {
    termino: 'escribano',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Fe pública',
    explicacion:
      'Notario de tipo latino en Argentina y Uruguay: redacta el instrumento, da fe de su contenido y lo conserva en protocolo. No es el notary public anglosajón.',
    estrategias: [
      'Traducir por «civil-law notary» o conservar «escribano» con glosa.',
      'Nunca «notary public» a secas.',
    ],
    fuentes: ['Ley 404 del Notariado (Ciudad de Buenos Aires)'],
    variantes: ['escribanía'],
  },
  {
    termino: 'concurso de acreedores',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho concursal',
    explicacion:
      'Procedimiento único de insolvencia con fase común y salida en convenio o liquidación. No se superpone con los capítulos del Bankruptcy Code estadounidense.',
    estrategias: [
      'Traducir por «insolvency proceedings» y evitar «Chapter 11», que remite a un régimen concreto.',
    ],
    fuentes: ['Texto Refundido de la Ley Concursal (España)'],
  },
  {
    termino: 'querella',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho procesal penal',
    explicacion:
      'Escrito por el que el particular se constituye en parte acusadora, a diferencia de la denuncia, que solo pone los hechos en conocimiento. El inglés usa complaint para ambas.',
    estrategias: [
      'Traducir por «criminal complaint filed as a private prosecutor» o conservar el término con glosa.',
      'Distinguir siempre de «denuncia».',
    ],
    fuentes: ['Ley de Enjuiciamiento Criminal, arts. 270 y ss.'],
    variantes: ['denuncia'],
  },
  {
    termino: 'recurso de casación',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Recurso extraordinario limitado a la infracción de ley o de doctrina, ante el tribunal supremo. No coincide con el appeal, que suele permitir revisar los hechos.',
    estrategias: [
      'Traducir por «cassation appeal» con glosa, o «appeal on points of law only».',
      'Evitar «appeal» a secas.',
    ],
    fuentes: ['Ley de Enjuiciamiento Civil (España)'],
  },
  {
    termino: 'bienes gananciales',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho de familia',
    explicacion:
      'Régimen económico matrimonial de comunidad sobre lo adquirido durante el matrimonio. Solo algunos estados de EE. UU. conocen la community property.',
    estrategias: [
      'Traducir por «community property» cuando el destino la conozca, con advertencia.',
      'En otros casos, «marital property under the Spanish community regime» con glosa.',
    ],
    fuentes: ['Código Civil español, arts. 1344 y ss.'],
  },
  {
    termino: 'legítima',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Sucesiones',
    explicacion:
      'Porción de la herencia reservada por ley a ciertos herederos. El common law parte de la libertad de testar, de modo que la figura no existe.',
    estrategias: [
      'Traducir por «forced share» o «reserved portion» con glosa explicativa.',
      'Evitar «legitimate», que es un falso amigo absoluto.',
    ],
    fuentes: ['Código Civil español, arts. 806 y ss.'],
    variantes: ['heredero forzoso', 'legitimario'],
  },
  {
    termino: 'usufructo',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derechos reales',
    explicacion:
      'Derecho real de usar y disfrutar bien ajeno conservando su sustancia. El life estate anglosajón se le aproxima pero pertenece a la doctrina de los estates.',
    estrategias: [
      'Traducir por «usufruct» (término reconocido en textos comparados) con glosa.',
      'Usar «life estate» solo si el usufructo es vitalicio y el lector es de common law.',
    ],
    fuentes: ['Código Civil español, arts. 467 y ss.'],
  },
  {
    termino: 'empadronamiento',
    idioma: 'es',
    sistema: 'administrativo',
    ambito: 'Administración local',
    explicacion:
      'Inscripción en el registro municipal de habitantes, con efectos para derechos y prestaciones. No hay registro de residencia equivalente en el mundo anglosajón.',
    estrategias: [
      'Traducir por «municipal residence registration» con el término original entre corchetes.',
    ],
    fuentes: ['Ley 7/1985 Reguladora de las Bases del Régimen Local'],
    variantes: ['padrón municipal', 'certificado de empadronamiento'],
  },
  {
    termino: 'oposiciones',
    idioma: 'es',
    sistema: 'administrativo',
    ambito: 'Función pública',
    explicacion:
      'Proceso selectivo público y competitivo para acceder a la función pública, con temario y tribunal. El civil service exam anglosajón no tiene su peso ni su formato.',
    estrategias: [
      'Traducir por «competitive public examinations for civil service posts» con el término original.',
    ],
    fuentes: ['Texto Refundido del Estatuto Básico del Empleado Público'],
  },
  {
    termino: 'finiquito',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho laboral',
    explicacion:
      'Documento de liquidación y saldo al extinguirse la relación laboral, que puede tener eficacia liberatoria. El final settlement anglosajón no lleva asociado ese efecto por sí solo.',
    estrategias: [
      'Traducir por «final settlement and release» con glosa sobre su eficacia liberatoria.',
    ],
    fuentes: ['Estatuto de los Trabajadores (España)'],
  },
  {
    termino: 'monotributo',
    idioma: 'es',
    sistema: 'administrativo',
    ambito: 'Derecho tributario',
    explicacion:
      'Régimen argentino simplificado que unifica impuesto, aportes previsionales y obra social en una cuota mensual. No hay figura equivalente.',
    estrategias: [
      'Conservar «monotributo» con glosa: simplified tax regime for small taxpayers.',
      'Nunca traducir por «single tax».',
    ],
    fuentes: ['Ley 24.977 y modificatorias (Argentina)'],
  },
  {
    termino: 'exhorto',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Cooperación judicial',
    explicacion:
      'Comunicación entre órganos judiciales para que uno practique una diligencia por encargo de otro. Se aproxima a la letter rogatory, pero también cubre la comunicación interna.',
    estrategias: [
      'Traducir por «letter rogatory» en el plano internacional y por «judicial request» en el interno.',
    ],
    fuentes: ['Convenio de La Haya de 1970 sobre obtención de pruebas'],
    variantes: ['oficio', 'cédula de notificación'],
  },
  {
    termino: 'sociedad anónima',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho societario',
    explicacion:
      'Forma societaria de capital dividido en acciones. Su equivalencia con la corporation, la public limited company o la Inc. depende del país de destino.',
    estrategias: [
      'No traducir la denominación social: se conserva «S. A.» y, si hace falta, se glosa.',
      'Elegir el equivalente descriptivo según la jurisdicción del lector.',
    ],
    fuentes: ['Ley de Sociedades de Capital (España)', 'Ley 19.550 (Argentina)'],
    variantes: ['sociedad de responsabilidad limitada', 'S.R.L.', 'S.L.'],
  },
  {
    termino: 'habeas data',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Protección de datos',
    explicacion:
      'Garantía constitucional de acceso y rectificación de los datos personales, con acción propia en varios países latinoamericanos.',
    estrategias: [
      'Conservar «habeas data» con glosa: constitutional action for access to and rectification of personal data.',
    ],
    fuentes: ['Constitución Nacional Argentina, art. 43', 'Ley 25.326 (Argentina)'],
  },
  {
    termino: 'allanamiento',
    idioma: 'es',
    sistema: 'civil-law',
    ambito: 'Derecho procesal',
    explicacion:
      'Doble sentido según la rama: entrada y registro en el proceso penal, o conformidad del demandado con la pretensión en el civil. Los equivalentes ingleses son opuestos entre sí.',
    estrategias: [
      'Desambiguar por contexto: «search of premises» (penal) o «submission to the claim» (civil).',
      'Marcar siempre como dependiente del contexto.',
    ],
    fuentes: ['Ley de Enjuiciamiento Civil, art. 21', 'Códigos procesales penales'],
  },
];

export function sinEquivalentePara(idioma: Idioma): TerminoSinEquivalente[] {
  return SIN_EQUIVALENTE.filter((t) => t.idioma === idioma);
}

/** Todas las formas detectables de un término, incluidas sus variantes. */
export function formasDe(t: TerminoSinEquivalente): string[] {
  return [t.termino, ...(t.variantes ?? [])];
}
