import { NextResponse } from 'next/server';
import { crearProyectoVacio, guardarProyecto, listarProyectos, obtenerEstilo } from '@/lib/almacen/repositorios';
import { esImagen, extraerDocumento } from '@/lib/extraccion/documentos';
import { ocrDeImagen } from '@/lib/ia/ocr';
import { bloquesDesdeTextoPlano, segmentar } from '@/lib/segmentar';
import { truncar } from '@/lib/utiles';
import type { Idioma } from '@/lib/tipos';

export const maxDuration = 300;

export async function GET() {
  return NextResponse.json({ proyectos: await listarProyectos() });
}

/**
 * Crea un proyecto a partir de un archivo o de texto pegado.
 * Con imágenes (o con un PDF escaneado) se pasa por OCR.
 */
export async function POST(request: Request) {
  try {
    const formulario = await request.formData();

    const archivo = formulario.get('archivo');
    const textoPegado = String(formulario.get('texto') ?? '').trim();
    const idiomaOrigen = (String(formulario.get('idiomaOrigen') ?? 'en') as Idioma) ?? 'en';
    const idiomaDestino = (String(formulario.get('idiomaDestino') ?? 'es') as Idioma) ?? 'es';
    const estiloId = String(formulario.get('estilo') ?? 'general');
    const glosarios = formulario.getAll('glosarios').map(String).filter(Boolean);
    const diccionarios = formulario.getAll('diccionarios').map(String).filter(Boolean);
    const forzarOcr = String(formulario.get('ocr') ?? '') === 'true';

    if (!(archivo instanceof File) && !textoPegado) {
      return NextResponse.json(
        { error: 'Hay que adjuntar un archivo o pegar el texto que se va a traducir.' },
        { status: 400 },
      );
    }

    let bloques;
    let textoPlano: string;
    let avisos: string[] = [];
    let datosArchivo: { nombre: string; tipo: string; tamano: number } | undefined;

    if (archivo instanceof File) {
      const buffer = Buffer.from(await archivo.arrayBuffer());
      datosArchivo = { nombre: archivo.name, tipo: archivo.type, tamano: archivo.size };

      if (esImagen(archivo.name, archivo.type) || forzarOcr) {
        const resultado = await ocrDeImagen({
          buffer,
          tipoMime: archivo.type || 'image/png',
          nombre: archivo.name,
        });
        bloques = resultado.bloques;
        textoPlano = resultado.textoPlano;
        avisos = resultado.avisos;
      } else {
        const resultado = await extraerDocumento(archivo.name, archivo.type, buffer);
        bloques = resultado.bloques;
        textoPlano = resultado.textoPlano;
        avisos = resultado.avisos;
      }
    } else {
      bloques = bloquesDesdeTextoPlano(textoPegado);
      textoPlano = textoPegado;
    }

    const segmentos = segmentar(bloques);
    if (!segmentos.length) {
      return NextResponse.json(
        {
          error:
            'No se pudo extraer texto del documento. Si es un escaneo, conviene subirlo como imagen para procesarlo con OCR.',
          avisos,
        },
        { status: 422 },
      );
    }

    const nombrePropuesto =
      String(formulario.get('nombre') ?? '').trim() ||
      datosArchivo?.nombre.replace(/\.[^.]+$/, '') ||
      truncar(textoPlano.replace(/\s+/g, ' '), 60);

    const estilo = await obtenerEstilo(estiloId);

    const proyecto = crearProyectoVacio({
      nombre: nombrePropuesto,
      idiomaOrigen,
      idiomaDestino,
      estilo: estilo.id,
      glosarios,
      diccionarios,
    });

    proyecto.segmentos = segmentos;
    proyecto.archivo = datosArchivo
      ? { ...datosArchivo, textoPlano }
      : { nombre: 'Texto pegado', tipo: 'text/plain', tamano: textoPlano.length, textoPlano };

    const guardado = await guardarProyecto(proyecto);

    return NextResponse.json({ proyecto: guardado, avisos });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear el proyecto.' },
      { status: 500 },
    );
  }
}
