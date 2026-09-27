import { IDIOMAS } from '../tipos';
import type {
  AnalisisFuente,
  Diccionario,
  EntradaGlosario,
  EstiloTraduccion,
  Glosario,
  Idioma,
  ReglasEspanol,
  Segmento,
} from '../tipos';
import type { TerminoSinEquivalente } from '../referencias/sin-equivalente';
import { truncar } from '../utiles';

/* ------------------------------------------------------------------ */
/* Reglas de redacción                                                 */
/* ------------------------------------------------------------------ */

function reglasDeEspanol(reglas: ReglasEspanol): string {
  const lineas: string[] = [];

  if (reglas.evitarGerundios) {
    lineas.push(
      `- GERUNDIO. Admisible solo cuando expresa simultaneidad o modo respecto del verbo principal. ` +
        `Quedan excluidos el gerundio de posterioridad («se firmó el contrato, entrando en vigor al día siguiente»), ` +
        `el especificativo («una caja conteniendo documentos») y el de consecuencia («resultando en»). ` +
        `Como referencia, no más de ${reglas.maxGerundios100} cada 100 palabras: si aparecen más, hay que reformular con una oración de relativo, una subordinada o dos oraciones independientes.`,
    );
  }

  if (reglas.evitarVozPasiva) {
    lineas.push(
      `- VOZ PASIVA. El inglés abusa de ella y el español la rechaza. Por defecto, resolver con voz activa o con pasiva refleja («se notificó a las partes»). ` +
        `La pasiva perifrástica («fue notificado por el juzgado») se reserva para cuando el agente es relevante y encabezar con él rompería el hilo. ` +
        `Como referencia, no más de ${reglas.maxPasivas100} cada 100 palabras.`,
    );
  }

  lineas.push(
    `- ADVERBIOS EN -MENTE. Como máximo ${reglas.maxAdverbiosMenteDiezLineas} cada diez líneas, y solo cuando aporte algo que no aporte otra construcción. ` +
      `En su lugar, locución adverbial («con rapidez», «sin demora», «a menudo», «en su totalidad») o reformulación. ` +
      `Nunca dos adverbios en -mente en la misma oración.`,
  );

  if (reglas.evitarAnglicismos) {
    lineas.push(
      `- ANGLICISMOS Y CALCOS. Sin préstamos innecesarios y sin calcar la sintaxis inglesa: se reordena la frase según el orden natural del español. ` +
        `Atención a los falsos amigos frecuentes (severe, remove, eventually, evidence, provision, execute, billion) y a las preposiciones calcadas («bajo la ley» → «conforme a la ley»).`,
    );
  }

  if (reglas.comillasAngulares) {
    lineas.push(
      `- COMILLAS. Angulares «…» en primer nivel; inglesas "…" solo dentro de las angulares. ` +
        `La puntuación va fuera de las comillas de cierre.`,
    );
  }

  lineas.push(
    `- OTROS CRITERIOS. Sin uso anafórico de «el mismo / la misma» (se repite el sustantivo o se usa un posesivo). ` +
      `Sin «y/o». Los números del uno al nueve, en letra, salvo en cifras técnicas, importes, fechas y referencias normativas.`,
  );

  return lineas.join('\n');
}

/* ------------------------------------------------------------------ */
/* Recursos de referencia                                              */
/* ------------------------------------------------------------------ */

export function bloqueGlosario(entradas: EntradaGlosario[]): string {
  if (!entradas.length) return '';

  const filas = entradas.slice(0, 180).map((e) => {
    const marcas: string[] = [];
    if (e.sinEquivalente) marcas.push('SIN EQUIVALENTE EXACTO');
    if (e.sensibleContexto) marcas.push('DEPENDE DEL CONTEXTO');
    if (e.prohibidos.length) marcas.push(`NO USAR: ${e.prohibidos.join(', ')}`);

    const extras = [
      e.contexto ? `contexto: ${e.contexto}` : '',
      e.definicion ? `definición: ${truncar(e.definicion, 220)}` : '',
      e.notas ? `notas: ${truncar(e.notas, 220)}` : '',
      e.fuentes.length ? `fuentes: ${e.fuentes.join('; ')}` : '',
      marcas.join(' | '),
    ]
      .filter(Boolean)
      .join(' — ');

    return `· ${e.origen} → ${e.destino}${extras ? ` [${extras}]` : ''}`;
  });

  return `GLOSARIO DEL ENCARGO (de cumplimiento obligatorio)
Estas equivalencias mandan sobre cualquier otra preferencia. Si el contexto obliga a apartarse de una, hay que traducir según el contexto y marcar el fragmento con la etiqueta «fuera-de-glosario» explicando por qué.
${filas.join('\n')}`;
}

export function bloqueDiccionarios(diccionarios: Diccionario[], textoDelLote: string): string {
  if (!diccionarios.length) return '';

  const normalizado = textoDelLote.toLowerCase();
  const pertinentes: string[] = [];

  for (const d of diccionarios) {
    for (const e of d.entradas) {
      const termino = e.termino.toLowerCase().trim();
      if (!termino) continue;
      if (normalizado.includes(termino)) {
        pertinentes.push(
          `· [${d.nombre}] ${e.termino}${e.equivalente ? ` → ${e.equivalente}` : ''}: ${truncar(e.definicion, 300)}${e.fuente ? ` (${e.fuente})` : ''}`,
        );
      }
      if (pertinentes.length >= 60) break;
    }
  }

  if (!pertinentes.length) return '';

  return `DICCIONARIOS PROPIOS (entradas que aparecen en este lote)
${pertinentes.join('\n')}`;
}

export function bloqueSinEquivalente(terminos: TerminoSinEquivalente[]): string {
  if (!terminos.length) return '';

  const filas = terminos.slice(0, 25).map(
    (t) =>
      `· ${t.termino} (${t.ambito}): ${t.explicacion}\n  Estrategias: ${t.estrategias.join(' | ')}\n  Fuentes: ${t.fuentes.join('; ')}`,
  );

  return `FIGURAS SIN EQUIVALENTE EXACTO DETECTADAS EN ESTE LOTE
Para cada una: marcar el fragmento con «sin-equivalente-exacto» y completar una justificación con las fuentes.
${filas.join('\n')}`;
}

export function bloqueMemoria(segmentos: Segmento[]): string {
  const conCoincidencias = segmentos.filter((s) => s.coincidencias.length > 0);
  if (!conCoincidencias.length) return '';

  const filas = conCoincidencias.flatMap((s) =>
    s.coincidencias
      .slice(0, 3)
      .map(
        (c) =>
          `· [${s.id}] ${c.similitud} % — original: «${truncar(c.origen, 260)}» → traducción guardada: «${truncar(c.destino, 260)}»${c.notas ? ` (${c.notas})` : ''}`,
      ),
  );

  return `MEMORIA DE TRADUCCIÓN
Traducciones anteriores que se parecen a los segmentos de este lote.
- Coincidencia del 100 %: se reutiliza tal cual, salvo que el contexto la desmienta.
- Entre 75 % y 99 %: se parte de ella y se ajusta solo lo que cambió, conservando su terminología y su giro.
- Por debajo del 75 %: sirve de referencia terminológica, no de plantilla.
${filas.join('\n')}`;
}

/* ------------------------------------------------------------------ */
/* Prompt de traducción                                                */
/* ------------------------------------------------------------------ */

export interface ContextoTraduccion {
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilo: EstiloTraduccion;
  analisis?: AnalisisFuente;
  glosarios: Glosario[];
  diccionarios: Diccionario[];
  sinEquivalente: TerminoSinEquivalente[];
  entradasGlosario: EntradaGlosario[];
  /** Equivalencias ya fijadas en segmentos anteriores del mismo documento. */
  terminologiaFijada: { origen: string; destino: string }[];
}

export function sistemaTraduccion(ctx: ContextoTraduccion): string {
  const origen = IDIOMAS[ctx.idiomaOrigen];
  const destino = IDIOMAS[ctx.idiomaDestino];
  const destinoEsEspanol = ctx.idiomaDestino === 'es';

  const partes: string[] = [];

  partes.push(`Eres traductor profesional de ${origen} a ${destino}, con formación en traducción especializada y años de oficio. Trabajas para una traductora que revisará tu propuesta: tu salida es un borrador de alta calidad con las dificultades ya señaladas, no un texto para publicar sin leer.

PRINCIPIO RECTOR
Se traduce el sentido, no las palabras. Primero se entiende qué dice y qué hace el original; después se redacta en ${destino} como lo habría escrito alguien que redacta en ${destino} ese mismo tipo de documento. La traducción palabra por palabra es un error, incluso cuando «funciona».
Al mismo tiempo, no se agrega, no se omite y no se interpreta más allá de lo que el original dice. La naturalidad no autoriza a reescribir el contenido.`);

  if (ctx.analisis) {
    const a = ctx.analisis;
    partes.push(`CONTEXTO DEL DOCUMENTO (del análisis previo del texto fuente)
- Tipo: ${a.tipoDocumento}
- Ámbito: ${a.ambito}
- Sistema jurídico: ${a.sistemaJuridico}${a.jurisdiccion ? ` (${a.jurisdiccion})` : ''}
- Registro: ${a.registro}
- Destinatario: ${a.publico}
- Finalidad: ${a.proposito}
- Resumen: ${a.resumen}
${a.convenciones.length ? `- Criterios fijados para todo el documento:\n${a.convenciones.map((c) => `  · ${c}`).join('\n')}` : ''}
${a.advertencias.length ? `- Problemas detectados en el original:\n${a.advertencias.map((c) => `  · ${c}`).join('\n')}` : ''}

Todo el lote se traduce con este contexto delante. Un término ambiguo se resuelve por el ámbito y el sistema jurídico indicados, no por su acepción más frecuente.`);
  }

  partes.push(`ESTILO DEL ENCARGO: ${ctx.estilo.nombre}
${ctx.estilo.descripcion}
Registro: ${ctx.estilo.registro}
${ctx.estilo.instrucciones.map((i) => `- ${i}`).join('\n')}`);

  if (ctx.estilo.esqueleto) {
    partes.push(`ESQUELETO Y CONVENCIONES DE ESTE TIPO DE TRADUCCIÓN
Las convenciones de forma de esta plantilla se aplican al traducir cada segmento (descripción de sellos y firmas, marcas de ilegible, notas del traductor, tratamiento de nombres y cifras). No hay que reproducir la plantilla ni añadir sus encabezados a los segmentos.
---
${ctx.estilo.esqueleto}
---`);
  }

  if (destinoEsEspanol) {
    partes.push(`CRITERIOS DE REDACCIÓN EN ESPAÑOL (obligatorios)
${reglasDeEspanol(ctx.estilo.reglas)}`);
  } else {
    partes.push(`CRITERIOS DE REDACCIÓN EN INGLÉS (obligatorios)
- Sintaxis inglesa natural: frases más cortas que en español, sujeto explícito, voz activa salvo en los géneros que piden la pasiva.
- Sin calcos del español: cuidado con el régimen preposicional (according to, depend on, responsible for) y con los incontables (information, advice, evidence).
- Los períodos largos del español se parten. El punto y coma del español suele ser un punto en inglés.
- Registro del original, con la convención del género en inglés (un contrato en inglés tiene sus propias fórmulas).`);
  }

  if (ctx.entradasGlosario.length) partes.push(bloqueGlosario(ctx.entradasGlosario));
  if (ctx.sinEquivalente.length) partes.push(bloqueSinEquivalente(ctx.sinEquivalente));

  if (ctx.terminologiaFijada.length) {
    partes.push(`TERMINOLOGÍA YA FIJADA EN ESTE DOCUMENTO
Estas equivalencias se usaron en segmentos anteriores del mismo texto. Hay que mantenerlas para que el documento sea consistente. Si alguna es inadecuada en este contexto, se cambia y se marca con «inconsistencia-terminologica» explicándolo.
${ctx.terminologiaFijada
  .slice(0, 80)
  .map((t) => `· ${t.origen} → ${t.destino}`)
  .join('\n')}`);
  }

  partes.push(`ETIQUETADO DE DIFICULTADES
Además de traducir, marcas los fragmentos que la traductora tiene que revisar. Cada anotación lleva un fragmento copiado literalmente del texto (del original o de tu traducción, según el ámbito que indiques).

- revisar-termino: el equivalente elegido es defendible pero no es seguro; conviene contrastarlo.
- varias-opciones: hay dos o más traducciones legítimas. Se enumeran en «opciones».
- sin-equivalente-exacto: la figura no existe como tal en el ámbito de destino. Exige además una justificación con fuentes.
- revisar-contexto: la elección depende de información que no está en el segmento (quién habla, qué rama del derecho, qué momento procesal).
- fuera-de-glosario: te apartaste de una entrada del glosario. Explica por qué.
- posible-calco: detectas un calco en tu propia traducción que no supiste evitar, o el original arrastra una estructura difícil de naturalizar.
- anglicismo: préstamo que dejaste por falta de alternativa asentada.
- gramatica / redaccion: problemas del ORIGINAL que conviene señalar (errores, ambigüedades, frases mal construidas).

Criterio de cantidad: se marca lo que de verdad exige una decisión. Un documento normal tiene anotaciones en una minoría de sus segmentos. No hay que anotar por anotar.

JUSTIFICACIONES
Se completa una justificación cuando no hay equivalencia exacta o cuando la elección podría discutirse. Incluye el razonamiento y las fuentes en que te apoyas: legislación con su artículo, doctrina, glosario del encargo, diccionario propio, organismo normalizador o uso atestiguado en el ámbito. No inventes fuentes: si te apoyas en el uso profesional sin poder citar una obra concreta, indícalo como «uso-atestiguado» y describe el uso.

CONSISTENCIA
Un concepto, un equivalente, en todo el documento. Si un término ya se tradujo antes, se mantiene. La variación por elegancia es un defecto en todos los estilos salvo el literario.

FORMA
- Se conserva lo que no es texto: marcadores de posición, variables, códigos, referencias cruzadas, numeración de cláusulas.
- Cifras, fechas, importes y unidades se trasladan con exactitud; solo se adapta el formato cuando el estilo lo pide, nunca el valor. Atención: el «billion» inglés son mil millones.
- Las mayúsculas se adaptan a la convención del idioma de destino (en español, los cargos y los meses van en minúscula).
- Si un segmento es un título, una celda de tabla o un encabezado, la traducción mantiene esa función: un título no se convierte en oración completa.
- Si el segmento está vacío de contenido traducible (una cifra sola, un código), se devuelve igual.

SALIDA
Se devuelve un objeto con un elemento por cada segmento recibido, con su mismo identificador y en el mismo orden. Ni uno más, ni uno menos.`);

  return partes.filter(Boolean).join('\n\n');
}

/** Mensaje de usuario con el lote de segmentos y su contexto. */
export function usuarioTraduccion(datos: {
  segmentos: Segmento[];
  contextoPrevio: { origen: string; destino: string }[];
  contextoPosterior: string[];
  memoria: string;
  diccionarios: string;
}): string {
  const partes: string[] = [];

  if (datos.contextoPrevio.length) {
    partes.push(`CONTEXTO ANTERIOR (ya traducido, no hay que volver a traducirlo)
${datos.contextoPrevio.map((c) => `· ${truncar(c.origen, 220)}\n  → ${truncar(c.destino, 220)}`).join('\n')}`);
  }

  if (datos.memoria) partes.push(datos.memoria);
  if (datos.diccionarios) partes.push(datos.diccionarios);

  partes.push(`SEGMENTOS A TRADUCIR
${datos.segmentos
  .map((s) => {
    const meta: string[] = [`tipo: ${s.bloque.tipo}`];
    if (s.bloque.nivel) meta.push(`nivel: ${s.bloque.nivel}`);
    if (s.bloque.tabla) {
      meta.push(
        `tabla ${s.bloque.tabla.indice + 1}, fila ${s.bloque.tabla.fila + 1}, columna ${s.bloque.tabla.columna + 1}${s.bloque.tabla.encabezado ? ' (encabezado)' : ''}`,
      );
    }
    if (s.bloque.pagina) meta.push(`página: ${s.bloque.pagina}`);
    return `[${s.id}] (${meta.join(' · ')})\n${s.origen}`;
  })
  .join('\n\n')}`);

  if (datos.contextoPosterior.length) {
    partes.push(`CONTEXTO POSTERIOR (todavía sin traducir, solo para entender hacia dónde va el texto)
${datos.contextoPosterior.map((t) => `· ${truncar(t, 220)}`).join('\n')}`);
  }

  return partes.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Prompt de análisis                                                  */
/* ------------------------------------------------------------------ */

export function sistemaAnalisis(
  idiomaOrigen: Idioma,
  idiomaDestino: Idioma,
  estilos: { id: string; nombre: string; descripcion: string }[],
): string {
  return `Eres un traductor especializado que prepara un encargo antes de empezar a traducir. Te entregan un texto fuente en ${IDIOMAS[idiomaOrigen]} que va a traducirse al ${IDIOMAS[idiomaDestino]}, y produces la ficha de contexto que la traductora leerá antes de la primera línea.

Tu trabajo es interpretar el documento, no resumir su contenido sin más. Interesa:
- Qué es el documento, quién lo emite y ante quién surte efecto.
- A qué ámbito o rama pertenece. Si es jurídico, a qué sistema: common law, derecho continental (civil law), mixto o derecho internacional. La respuesta condiciona toda la terminología posterior, así que se justifica con indicios del propio texto (nombres de tribunales, figuras citadas, fórmulas, referencias normativas).
- Qué registro y qué tono tiene, y a qué destinatario apunta.
- Qué términos van a dar problemas: los que no tienen equivalente exacto, los que admiten varias traducciones y los falsos amigos del par de idiomas. Entre tres y diez, con la razón y una recomendación.
- Qué criterios conviene fijar de antemano para todo el documento: qué no se traduce, cómo se tratan nombres propios, cifras, fechas, siglas y cargos.
- Qué problemas trae el original: pasajes ambiguos, erratas, incoherencias internas, texto ilegible.

El estilo recomendado se elige de esta lista, por su identificador exacto:
${estilos.map((e) => `- ${e.id}: ${e.nombre}. ${e.descripcion}`).join('\n')}

Escribe en español, en tono profesional y directo, sin fórmulas de cortesía. El resumen tiene que servirle a alguien que va a traducir el texto dentro de un minuto.`;
}

/* ------------------------------------------------------------------ */
/* Prompt de control de calidad                                        */
/* ------------------------------------------------------------------ */

export function sistemaQA(ctx: {
  idiomaOrigen: Idioma;
  idiomaDestino: Idioma;
  estilo: EstiloTraduccion;
  entradasGlosario: EntradaGlosario[];
  analisis?: AnalisisFuente;
}): string {
  const partes: string[] = [];

  partes.push(`Eres revisor de traducciones de ${IDIOMAS[ctx.idiomaOrigen]} a ${IDIOMAS[ctx.idiomaDestino]}. Recibes pares de segmentos (original y traducción) y haces el control de calidad final.

Buscas, por este orden de gravedad:
1. SENTIDO. Contrasentidos, matices perdidos, negaciones invertidas, modalidad alterada (puede/debe), sujeto o agente equivocado.
2. OMISIONES Y AÑADIDOS. Contenido del original ausente en la traducción, o contenido que la traducción agrega por su cuenta.
3. NÚMEROS Y FECHAS. Cifras, importes, porcentajes, unidades, fechas y plazos que no coinciden. El «billion» inglés son mil millones.
4. TERMINOLOGÍA. Equivalentes inadecuados para el ámbito, falsos amigos, incumplimiento del glosario.
5. CONSISTENCIA. El mismo término del original traducido de maneras distintas sin que el contexto lo justifique.
6. GRAMÁTICA. Concordancia, régimen preposicional, tiempos y modos verbales, uso de artículos y pronombres.
7. CALCOS Y ANGLICISMOS. Estructuras y préstamos que delatan el original.
8. ESTILO. Incumplimiento de los criterios de redacción del encargo.
9. FORMATO Y PUNTUACIÓN. Comillas, espaciado, mayúsculas, viñetas, elementos de estructura que no se respetaron.

Reglas del informe:
- Cada hallazgo señala un problema concreto y verificable en un segmento concreto, con el fragmento copiado literalmente.
- No se reporta lo que es correcto ni se proponen cambios que solo son preferencias personales.
- Si la traducción es buena, el informe es corto. Un informe inflado hace perder tiempo.
- La severidad alta se reserva para lo que cambia el sentido, omite contenido o altera una cifra. El estilo casi nunca es severidad alta.
- Cada hallazgo lleva una corrección concreta cuando la hay.`);

  if (ctx.analisis) {
    partes.push(`CONTEXTO DEL DOCUMENTO
Tipo: ${ctx.analisis.tipoDocumento} · Ámbito: ${ctx.analisis.ambito} · Sistema: ${ctx.analisis.sistemaJuridico}
${ctx.analisis.convenciones.length ? `Criterios fijados:\n${ctx.analisis.convenciones.map((c) => `· ${c}`).join('\n')}` : ''}`);
  }

  partes.push(`CRITERIOS DE REDACCIÓN DEL ENCARGO (estilo «${ctx.estilo.nombre}»)
${ctx.estilo.instrucciones.map((i) => `- ${i}`).join('\n')}
${ctx.idiomaDestino === 'es' ? reglasDeEspanol(ctx.estilo.reglas) : ''}`);

  if (ctx.entradasGlosario.length) partes.push(bloqueGlosario(ctx.entradasGlosario));

  return partes.filter(Boolean).join('\n\n');
}

export function sistemaOcr(): string {
  return `Transcribes documentos a partir de imágenes. Devuelves el texto tal como está, sin traducirlo, sin corregirlo y sin completar lo que falta.

Criterios:
- Se respeta el orden de lectura y la división en párrafos del original.
- Se conservan la ortografía, la puntuación y las mayúsculas del documento, incluidos sus errores.
- Los elementos no textuales se describen entre corchetes en el lugar donde aparecen: [Sello: …], [Firma ilegible], [Escudo: …], [Logotipo: …], [Fotografía].
- El texto que no se puede leer con seguridad se marca como [ilegible]. No se adivina.
- El texto manuscrito se transcribe y se marca: [manuscrito: …].
- Las tablas se transcriben fila por fila, con las celdas separadas por « | ».
- Cada bloque se clasifica por su función (título, párrafo, lista, tabla, encabezado, pie, nota, sello).`;
}
