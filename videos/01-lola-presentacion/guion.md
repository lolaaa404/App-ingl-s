# Lola, presentación — guion

**Formato:** 1920×1080 (16:9), 30 fps, ~63 s · YouTube, web, presentaciones
**Objetivo:** que una traductora o un traductor entienda en un minuto qué hace Lola y por qué es una mesa de trabajo y no un botón.
**Estilo:** interfaz en movimiento (la app recreada en HTML con cámara virtual y cursor) sobre fondo oscuro con luces verde petróleo y ámbar · tipografías Fraunces (títulos), Inter (interfaz y subtítulos) y Source Serif 4 (texto de lectura, como la app) · música `minimal` (96 BPM), sintetizada.
**Voz:** neural provisoria `es-AR-ElenaNeural` (+12 %) · subtítulos con la palabra que suena resaltada.

## Texto de la voz
> Lola no es un traductor automático con un botón. Es una mesa de trabajo para traducir con criterio.
> Subí un PDF, un Word o un escaneo: Lola lee el texto y describe sellos y firmas.
> Antes de traducir, entiende el documento: ámbito, registro y términos conflictivos.
> Traduce por lotes con tu memoria, tus glosarios y la terminología ya fijada.
> Original y traducción, lado a lado, con cada dificultad marcada por color: calcos, falsos amigos, figuras sin equivalente.
> Tocás un segmento y cada elección viene justificada, con fuentes y alternativas descartadas.
> El control de calidad revisa cifras, fechas y glosario, y una segunda lectura detecta omisiones.
> La memoria reutiliza lo ya traducido. Y exportás a Word con la estructura del original.
> Lola. El motor propone. Vos decidís.

## Escena por escena
Los tiempos salen de la voz (`scripts/locucion.py` genera una toma por escena y mide cada una).

| # | Tiempo aprox. | Voz | Imagen | Qué muestra la app |
|---|---|---|---|---|
| 0 | 0–7 s | Hook | Titular grande; la ventana de la app asoma abajo y sube | Pantalla de inicio |
| 1 | 7–14 s | Cargar | Zoom al panel «Nuevo encargo»; el PDF se arrastra; fichas PDF · Word · PowerPoint · Imagen; tarjeta del escaneo con `[Sello…]` y `[Firma…]` | Carga de documento, nombre y estilo |
| 2 | 14–21 s | Leer la fuente | Se pulsa «Analizar fuente»; la ficha se llena | Lectura del texto fuente: tipo, ámbito, sistema, registro, términos que exigen decisión |
| 3 | 21–27 s | Traducir | Se pulsa «Traducir»; barra de progreso; las filas se escriben; se tildan glosarios | Pestaña Recursos, memoria 100 %, traducción por lotes |
| 4 | 27–36 s | Revisar | Zoom al banco; aparecen los resaltados por color | Etiquetas: Varias opciones, Posible calco, Sin equivalente exacto, Revisar término |
| 5 | 36–42 s | Justificación | Clic en una etiqueta; el panel Detalle se desplaza | Alternativas, justificación, fuentes, descartadas, memoria al 82 % |
| 6 | 42–49 s | Calidad | «Control de calidad»; la lista se recorre por categoría; la omisión se marca en el banco | 7 hallazgos: reglas y lectura del modelo |
| 7 | 49–56 s | Memoria y Word | «Guardar en memoria»; menú Exportar; tarjeta del documento | Aviso de memoria, exportación a Word |
| 8 | 56–63 s | Cierre | La ventana se aleja y se apaga | «Lola. El motor propone. Vos decidís.» |

## Variantes
Una sola versión (control). Si se quiere testear: el hook de la escena 0 es lo más barato de cambiar (`base.textos.hook1`/`hook2` y la primera frase de `escenas`), con su propia toma de voz.

## Texto de la publicación
Lola es un asistente de traducción español ⇄ inglés pensado como mesa de trabajo: lee el documento antes de traducir, usa tu memoria y tus glosarios, marca cada dificultad por color, justifica cada decisión con sus fuentes y revisa la calidad al final. El motor propone; vos decidís.

#traducción #traductores #localización #IA #herramientas

## Antes de publicar
- Los datos en pantalla son de ejemplo (contrato Acme / Beta Servicios, importes, fechas y hallazgos del control de calidad están inventados para la demo). El video lo avisa al final («Encargo de ejemplo»); no presentarlo como un trabajo real.
- La voz es neural y provisoria: para publicar conviene grabarla (la animación se ancla a las palabras, así que una voz nueva se reajusta con `scripts/palabras.py`).
- Hay un solo nivel de zoom por pantalla: en el celular, la interfaz se lee mejor en la escena de cada panel que en las tomas de conjunto.
