# Lola · asistente de traducción español ⇄ inglés

Banco de trabajo para traducir del inglés al español y del español al inglés con
criterio profesional: memoria de traducción, glosarios propios, etiquetado de las
dificultades, justificación de las decisiones terminológicas y control de calidad
final.

No es un traductor automático con un botón. Es una mesa de trabajo: el motor
propone, marca lo que hay que revisar y explica por qué eligió cada término; la
traductora decide.

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local     # y completar la clave del modelo
npm run probar-modelo          # comprueba la clave y a qué modelos llega
npm run dev                    # http://localhost:3000
```

Sirve una de estas dos claves; si están las dos, manda Gemini:

- **Gemini directo**: `GOOGLE_GENERATIVE_AI_API_KEY`, de
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- **AI Gateway de Vercel**: `AI_GATEWAY_API_KEY`, del panel de Vercel en
  **AI → API Keys**. Da acceso a modelos de varios proveedores con una sola clave.

El modelo se cambia con las variables `MODELO_*` sin tocar el código: con Gemini se
pone solo el nombre (`gemini-3.1-flash-lite-preview`), con el Gateway el par
`proveedor/modelo` (`anthropic/claude-sonnet-5`).

### Qué modelo elegir

`npm run probar-modelo` hace una llamada mínima a varios candidatos y, además de
decir cuáles responden, pide una traducción con tres falsos amigos jurídicos
(*held*, *evidence*, *statute*) para ver la calidad. Acepta nombres concretos:

```bash
npm run probar-modelo -- gemini-3.5-flash gemini-2.5-flash
```

Conviene saber, para una clave de Gemini del nivel gratuito:

- Los modelos **pro** devuelven cuota agotada, y `gemini-2.5-pro` ya no se sirve a
  cuentas nuevas.
- `gemini-3.5-flash` da buena calidad pero se satura con frecuencia («high demand»).
- `gemini-3.1-flash-lite-preview` responde rápido y resuelve bien la terminología
  jurídica; es el valor recomendado para empezar.
- `gemini-2.5-flash` es rápido pero traduce *statute* por «estatuto» y *held* por
  «sostuvo», que son dos de los calcos que el propio control marca.

Sin clave la aplicación arranca igual: se pueden cargar documentos, glosarios,
memorias y diccionarios, editar traducciones a mano y ejecutar el control de
calidad por reglas. Lo que necesita modelo es el análisis del texto fuente, la
traducción, el OCR y la parte del control que exige leer y entender.

---

## Cómo se trabaja un encargo

1. **Cargar el documento.** PDF, Word (.docx), PowerPoint (.pptx), texto, RTF o una
   imagen. De un PDF con capa de texto se extraen los párrafos y se detectan los
   títulos por el tamaño de fuente; de una imagen o un escaneo se obtiene el texto
   por OCR, que además describe sellos, firmas y zonas ilegibles en su lugar.
   También se puede pegar el texto directamente.

2. **Leer el texto fuente.** Antes de traducir, la aplicación interpreta el
   documento y devuelve una ficha: qué es, de qué ámbito viene, a qué sistema
   jurídico pertenece (*common law*, derecho continental, mixto, internacional),
   qué registro tiene, a quién va dirigido, qué términos van a dar problemas y qué
   criterios conviene fijar para todo el texto. Esa ficha acompaña después a cada
   lote de traducción, de modo que no se traduce palabra por palabra sino con el
   documento entendido.

3. **Traducir.** El texto se divide en segmentos (respetando abreviaturas como
   «art. 15» o «S. A.», que no cierran oración) y se traduce por lotes. Cada lote
   recibe el contexto anterior ya traducido, el posterior sin traducir, las
   coincidencias de la memoria, las entradas de glosario que aparecen en ese lote,
   los diccionarios propios y la terminología ya fijada en segmentos anteriores.
   Las coincidencias del 100 % en la memoria se reutilizan sin pasar por el modelo.

4. **Revisar.** El banco bilingüe muestra original y traducción lado a lado, con
   los fragmentos problemáticos resaltados por color. Al pulsar un segmento, el
   panel lateral muestra sus etiquetas, las alternativas de traducción, la
   justificación de cada elección con sus fuentes y lo que dice la memoria.

5. **Control de calidad.** Dos niveles: las reglas (instantáneas y deterministas) y
   la lectura del modelo, que contrasta sentido y matices contra el original.

6. **Cerrar.** Los segmentos confirmados se guardan en la memoria de traducción y
   quedan disponibles para los encargos siguientes. La exportación reconstruye el
   documento con la estructura del original.

---

## Etiquetas

Cada fragmento marcado lleva su color dentro del texto:

| Etiqueta | Cuándo aparece |
| --- | --- |
| **Revisar término** | El equivalente es defendible pero no seguro. |
| **Posible calco** | La estructura o el término reproducen el inglés. |
| **Sin equivalente exacto** | La figura no existe como tal en el otro ordenamiento. |
| **Revisar contexto** | La elección depende de información ausente del segmento. |
| **Inconsistencia terminológica** | El mismo término se tradujo de varias maneras. |
| **Varias opciones** | Hay más de una traducción legítima; se enumeran. |
| **Fuera de glosario** | La traducción no respeta el glosario del encargo. |
| **Anglicismo** | Préstamo evitable con equivalente asentado. |
| **Gramática** / **Redacción** | Error o problema de estilo. |
| **Omisión** / **Número o fecha** / **Formato** | Hallazgos del control de calidad. |

Los términos que dependen del contexto llevan color propio (violeta) y no van en
negrita, para distinguirlos de los que piden una corrección.

---

## Estilos de traducción

Nueve estilos de fábrica: general, traducción pública, jurídica,
técnico-científica, médica, económico-financiera, académica, literaria y
localización. Cada uno lleva su registro, sus instrucciones (que se le pasan al
motor en cada lote) y sus criterios de redacción.

La **traducción pública** incluye un esqueleto editable con las convenciones del
género: descripción de sellos y firmas entre corchetes, marcas de `[ilegible]` y
`[sic]`, notas del traductor, tratamiento de nombres propios y cifras, y las
fórmulas de cierre en los dos sentidos. Los estilos jurídico y de contratos traen
sus propias plantillas.

Los estilos de fábrica no se modifican: se duplican y se edita la copia, con lo
que el criterio original queda disponible como referencia. Los estilos propios se
crean desde cero o a partir de una copia.

### Criterios de redacción en español

Configurables por estilo y comprobados por regla sobre la traducción:

- **Gerundio.** Solo con valor de simultaneidad o modo. Quedan fuera el gerundio de
  posterioridad, el especificativo y el de consecuencia. Cupo por cada 100 palabras.
- **Voz pasiva.** Por defecto, activa o pasiva refleja con «se». La perifrástica se
  reserva para cuando el agente importa. Cupo por cada 100 palabras.
- **Adverbios en -mente.** Uno cada diez líneas por defecto. Se cuenta sobre el
  documento y también por segmento.
- **Anglicismos y calcos**, y **comillas angulares**.

---

## Control de calidad

**Por reglas**, sin modelo y siempre igual:

- Segmentos sin traducir, traducciones idénticas al original y traducciones
  sospechosamente cortas.
- Cifras que no coinciden, con normalización de separadores: `1,250,000.50` y
  `1.250.000,50` son el mismo valor y no dan aviso. El `billion` inglés se señala
  como riesgo aparte.
- Fechas que no coinciden, con las numéricas tratadas como ambiguas porque el
  inglés escribe mes/día y el español día/mes.
- Marcadores y variables (`{nombre}`, `%s`, `<b>`) que desaparecieron.
- Cumplimiento del glosario, incluidas las traducciones vedadas.
- Calcos, falsos amigos y anglicismos, con un repertorio propio que incluye los
  falsos amigos jurídicos (*evidence*, *provision*, *execute*, *motion*, *offence*).
- Consistencia: segmentos idénticos traducidos de distinta forma, términos
  definidos sin equivalente común y términos que el motor justificó de dos maneras.
- Gerundios, pasivas y adverbios por encima del cupo del estilo.
- Espaciado, puntuación final y paréntesis o comillas sin cerrar.

**Con modelo**, encima de lo anterior: contrasentidos, matices perdidos,
negaciones invertidas, modalidad alterada, omisiones y añadidos, y todo lo que
exige entender los dos textos.

El informe se filtra por severidad y categoría, cada hallazgo lleva al segmento
correspondiente y se puede descargar en Markdown.

---

## Memoria, glosarios y diccionarios

**Memoria de traducción.** Se llena al confirmar segmentos. La búsqueda combina
distancia de edición con solapamiento de palabras, sobre un índice invertido para
que no crezca el coste con el tamaño de la memoria. Importa CSV, TSV y TMX;
exporta CSV.

**Glosarios.** Cada entrada lleva término, equivalente, contexto, definición,
fuentes, traducciones vedadas y dos marcas: *depende del contexto* y *sin
equivalente exacto*. Sus equivalencias mandan sobre el criterio del motor: si el
contexto obliga a apartarse de una, la traducción se marca y se explica.
Importa y exporta CSV/TSV.

Viene un glosario de fábrica con más de cuarenta figuras del *common law* y del
derecho continental que no tienen equivalente exacto en el otro ordenamiento
(*consideration*, *estoppel*, *trust*, *discovery*, *probate*; amparo, fuero,
legítima, escribano, concurso de acreedores, habeas data), cada una con su
explicación, sus estrategias de traducción y sus fuentes.

**Diccionarios propios.** Fuentes de consulta adicionales. Cuando un término del
diccionario aparece en el texto, su definición se le pasa al motor junto con el
segmento. Admite CSV/TSV, listas «término: definición» y documentos de Word o PDF.

---

## Exportación

| Formato | Contenido |
| --- | --- |
| **Word** | La traducción con la estructura del original: títulos, listas, tablas y párrafos reconstruidos. Opcionalmente, con la plantilla del estilo al principio. |
| **Revisión bilingüe (Word)** | Tabla de cuatro columnas: número, original, traducción y observaciones (etiquetas, justificaciones con fuentes y notas). |
| **Texto plano** | La traducción con los párrafos reconstruidos. |
| **TSV bilingüe** | Para volcar en otra herramienta. |
| **Informe de calidad** | Markdown, agrupado por severidad. |

---

## Dónde viven los datos

Todo en archivos JSON dentro de `datos/` (configurable con `DATOS_DIR`):

```
datos/
  proyectos/<id>.json    un archivo por encargo, con sus segmentos y su informe
  memoria.json           memoria de traducción
  glosarios.json         glosarios propios
  diccionarios.json      diccionarios propios
  estilos.json           estilos propios (los de fábrica viven en el código)
```

Se eligió el disco local en lugar de una base de datos porque la herramienta está
pensada para el trabajo de una persona en su propia máquina: los glosarios y la
memoria quedan en archivos que se pueden copiar, versionar o respaldar. La capa de
persistencia está aislada en `src/lib/almacen/`, de modo que cambiarla por Postgres
no toca el resto del código. Para varios usuarios o para trabajar en la nube hay
que dar ese paso.

---

## Estructura del código

```
src/
  app/
    page.tsx                    listado de encargos y formulario de carga
    proyecto/[id]/page.tsx      banco de trabajo
    memoria|glosarios|diccionarios|estilos/
    api/                        rutas de servidor
  components/
    banco/                      banco bilingüe, resaltado y paneles
    Gestor*.tsx                 pantallas de gestión
    ui.tsx                      primitivas de interfaz
  lib/
    tipos.ts                    modelo de dominio
    segmentar.ts                división en oraciones con abreviaturas
    etiquetas.ts                sistema de etiquetas y colores
    almacen/                    persistencia en archivos
    extraccion/                 PDF, Word, PowerPoint, texto, RTF
    ia/                         modelo, prompts, esquemas, análisis, traducción, QA, OCR
    qa/                         reglas, estilo en español, números y fechas
    memoria/                    coincidencias difusas
    glosario/                   detección y cumplimiento
    referencias/                calcos, falsos amigos, figuras sin equivalente
    estilos/                    estilos de fábrica
    importar/                   CSV, TSV, TMX
    exportar/                   Word, texto, TSV, informe
```

La traducción se procesa por lotes **en serie**, no en paralelo: cada lote recibe
la terminología fijada por los anteriores, y es lo que mantiene el documento
consistente. Un documento largo tarda más por esa decisión.

---

## Límites conocidos

- La reconstrucción del documento conserva la estructura (títulos, listas, tablas,
  párrafos), no el formato fino del original: tipografías, colores, sangrías,
  encabezados de página y numeración automática se pierden. Para una entrega que
  deba calcar el original conviene traducir sobre una copia del documento.
- El OCR va por el modelo multimodal, que en documentos oficiales rinde mejor que
  un OCR clásico porque describe sellos y firmas, pero no devuelve coordenadas: no
  se puede reconstruir la maqueta de un escaneo.
- La división en oraciones prefiere quedarse corta antes que partir mal: una sigla
  con puntos al final de la frase («… Beta Servicios S. A. Las partes…») deja un
  segmento más largo en lugar de arriesgar un corte en medio de una oración.
- La detección de términos definidos busca palabras capitalizadas en medio de la
  oración, que es lo que son en un contrato o una sentencia. En textos sin esa
  convención aporta poco; la consistencia fina queda para la lectura del modelo.
- El `.doc` antiguo no se admite: hay que guardarlo como `.docx`.
