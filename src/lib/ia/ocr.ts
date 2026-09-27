import 'server-only';

import { generateText, Output } from 'ai';
import { esquemaOcr } from './esquemas';
import { sistemaOcr } from './prompts';
import { exigirClave, mensajeDeError, modeloPara } from './modelo';
import type { ResultadoExtraccion } from '../extraccion/documentos';
import type { BloqueTexto } from '../segmentar';

/**
 * Reconocimiento óptico de caracteres sobre imágenes y documentos escaneados.
 *
 * Se resuelve con el modelo multimodal en lugar de un OCR clásico porque en
 * documentos oficiales importa tanto el texto como lo que lo rodea: sellos,
 * firmas, membretes y zonas ilegibles, que el modelo describe en su sitio y un
 * OCR tradicional se limita a ignorar o a convertir en ruido.
 */
export async function ocrDeImagen(opciones: {
  buffer: Buffer;
  tipoMime: string;
  nombre: string;
}): Promise<ResultadoExtraccion> {
  exigirClave();

  const { buffer, tipoMime, nombre } = opciones;

  try {
    const { output } = await generateText({
      model: modeloPara('ocr'),
      output: Output.object({ schema: esquemaOcr }),
      system: sistemaOcr(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Transcribe el documento de esta imagen (archivo «${nombre}»).`,
            },
            {
              type: 'image',
              image: new Uint8Array(buffer),
              mediaType: tipoMime || 'image/png',
            },
          ],
        },
      ],
    });

    const bloques: BloqueTexto[] = output.bloques
      .filter((b) => b.texto.trim())
      .map((b) => ({ texto: b.texto.trim(), tipo: b.tipo }));

    const avisos = [
      `Texto obtenido por OCR de «${nombre}». Conviene cotejarlo con el original antes de traducir.`,
      ...output.observaciones.map((o) => `OCR: ${o}`),
    ];

    return {
      bloques: bloques.length ? bloques : [{ texto: output.texto, tipo: 'parrafo' }],
      textoPlano: output.texto,
      avisos,
    };
  } catch (error) {
    throw new Error(`No se pudo procesar la imagen con OCR. ${mensajeDeError(error)}`);
  }
}
