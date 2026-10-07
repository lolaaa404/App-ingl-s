# 01 · Lola, presentación

Video horizontal (16:9) de ~64 s que muestra qué hace Lola, el asistente de traducción español ⇄ inglés, y sus puntos fuertes. Para presentarla a traductoras y traductores (YouTube, web, presentaciones). La interfaz está recreada en HTML con datos de ejemplo.

## Estado (2026-10-07)
**Listo para revisar. Falta decidir si se queda con la voz neural provisoria o se graba la voz real.**

| Entrega | Duración | Qué cambia |
|---|---|---|
| `entregas/lola-presentacion.mp4` | 63,6 s | Única versión (control) |

## Texto de la publicación
Lola es un asistente de traducción español ⇄ inglés pensado como mesa de trabajo: lee el documento antes de traducir, usa tu memoria y tus glosarios, marca cada dificultad por color, justifica cada decisión con sus fuentes y revisa la calidad al final. El motor propone; vos decidís.

#traducción #traductores #localización #IA #herramientas · Portada sugerida: `entregas/lola-presentacion-portada.jpg` (segundo 4,6)

## Test A/B
No hay. Si se quiere probar, lo más barato es el hook (`base.textos.hook1`, `hook2` y la primera frase de `base.textos.escenas`, con su propia toma de voz).

## Pendientes antes de publicar
1. Los datos en pantalla son de ejemplo (contrato Acme / Beta Servicios, importes, fechas y los 7 hallazgos del control de calidad son inventados). El cierre dice «Encargo de ejemplo»; no presentarlo como un trabajo real.
2. La voz es neural y provisoria (`es-AR-ElenaNeural`). Nadie la escuchó todavía: revisar la pronunciación de «Word» y «PDF». Para una voz grabada: `python scripts/palabras.py <voz> out/palabras/locucion.json` y ajustar `base.tiempos.escenas`.
3. Si la app cambia (colores, etiquetas, textos), hay que actualizar la réplica en `proyecto/pieza.html`.

## Regenerar
```sh
cd proyecto && npm install && pip install numpy scipy pillow edge-tts
python scripts/locucion.py es-AR-ElenaNeural +12%   # voz por escenas; escribe los tiempos en video.json
node render.mjs --hoja        # revisar cuadros
node render.mjs               # entregas/lola-presentacion.mp4
node render.mjs --portada 4.6
```
No hace falta material externo: todo sale de código, fuentes `@fontsource` y música sintetizada.
