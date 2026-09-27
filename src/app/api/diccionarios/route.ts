import { NextResponse } from 'next/server';
import { borrarDiccionario, guardarDiccionario, listarDiccionarios } from '@/lib/almacen/repositorios';
import { importarDiccionario } from '@/lib/importar/tablas';
import { extraerDocumento } from '@/lib/extraccion/documentos';
import { ahora, id } from '@/lib/utiles';
import type { Diccionario } from '@/lib/tipos';

export const maxDuration = 120;

export async function GET() {
  return NextResponse.json({ diccionarios: await listarDiccionarios() });
}

/**
 * Carga un diccionario propio. Admite tablas (CSV/TSV), listas de
 * «término: definición» y documentos de Word o PDF, de los que se extrae el
 * texto y se buscan entradas con esa forma.
 */
export async function POST(request: Request) {
  try {
    const formulario = await request.formData();
    const archivo = formulario.get('archivo');
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: 'Falta el archivo.' }, { status: 400 });
    }

    const esTabular = /\.(csv|tsv|txt|md)$/i.test(archivo.name);
    const contenido = esTabular
      ? await archivo.text()
      : (
          await extraerDocumento(
            archivo.name,
            archivo.type,
            Buffer.from(await archivo.arrayBuffer()),
          )
        ).textoPlano;

    const { entradas, avisos } = importarDiccionario(contenido);
    if (!entradas.length) {
      return NextResponse.json(
        {
          error:
            'No se reconoció ninguna entrada. El archivo debe tener columnas (término, equivalente, definición) o líneas con la forma «término: definición».',
          avisos,
        },
        { status: 422 },
      );
    }

    const diccionario: Diccionario = {
      id: id('dcc'),
      nombre:
        String(formulario.get('nombre') ?? '').trim() || archivo.name.replace(/\.[^.]+$/, ''),
      descripcion: String(formulario.get('descripcion') ?? '').trim() || undefined,
      entradas,
      creado: ahora(),
      actualizado: ahora(),
    };

    return NextResponse.json({
      diccionario: await guardarDiccionario(diccionario),
      importadas: entradas.length,
      avisos,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el diccionario.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const diccionarioId = new URL(request.url).searchParams.get('id');
  if (!diccionarioId) return NextResponse.json({ error: 'Falta el identificador.' }, { status: 400 });
  await borrarDiccionario(diccionarioId);
  return NextResponse.json({ ok: true });
}
