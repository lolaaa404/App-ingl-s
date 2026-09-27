import { NextResponse } from 'next/server';
import { borrarGlosario, guardarGlosario, listarGlosarios } from '@/lib/almacen/repositorios';
import { glosarioACsv, importarGlosario } from '@/lib/importar/tablas';
import { ahora, id } from '@/lib/utiles';
import type { Glosario, Idioma } from '@/lib/tipos';

export const maxDuration = 120;

export async function GET(request: Request) {
  const parametros = new URL(request.url).searchParams;
  const glosarios = await listarGlosarios();

  const exportarId = parametros.get('exportar');
  if (exportarId) {
    const glosario = glosarios.find((g) => g.id === exportarId);
    if (!glosario) return NextResponse.json({ error: 'No existe el glosario.' }, { status: 404 });
    return new Response(glosarioACsv(glosario.entradas), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(glosario.nombre)}.csv"`,
      },
    });
  }

  return NextResponse.json({ glosarios });
}

/** Crea un glosario o importa entradas en uno existente. */
export async function POST(request: Request) {
  const tipoContenido = request.headers.get('content-type') ?? '';

  try {
    if (tipoContenido.includes('multipart/form-data')) {
      const formulario = await request.formData();
      const archivo = formulario.get('archivo');
      if (!(archivo instanceof File)) {
        return NextResponse.json({ error: 'Falta el archivo.' }, { status: 400 });
      }

      const idiomaOrigen = (String(formulario.get('idiomaOrigen') ?? 'en') as Idioma) ?? 'en';
      const glosarioId = String(formulario.get('glosarioId') ?? '').trim();
      const nombre =
        String(formulario.get('nombre') ?? '').trim() || archivo.name.replace(/\.[^.]+$/, '');
      const dominio = String(formulario.get('dominio') ?? '').trim() || 'General';

      const { entradas, avisos } = importarGlosario(await archivo.text(), idiomaOrigen);
      if (!entradas.length) {
        return NextResponse.json(
          { error: 'No se reconoció ninguna entrada en el archivo.', avisos },
          { status: 422 },
        );
      }

      const glosarios = await listarGlosarios();
      const existente = glosarioId ? glosarios.find((g) => g.id === glosarioId) : undefined;

      const glosario: Glosario = existente
        ? { ...existente, entradas: [...existente.entradas, ...entradas] }
        : {
            id: id('gs'),
            nombre,
            dominio,
            descripcion: `Importado de ${archivo.name}`,
            entradas,
            creado: ahora(),
            actualizado: ahora(),
          };

      const guardado = await guardarGlosario(glosario);
      return NextResponse.json({ glosario: guardado, importadas: entradas.length, avisos });
    }

    const cuerpo = (await request.json()) as { glosario: Glosario };
    if (!cuerpo.glosario?.nombre) {
      return NextResponse.json({ error: 'Falta el nombre del glosario.' }, { status: 400 });
    }

    const glosario: Glosario = {
      ...cuerpo.glosario,
      id: cuerpo.glosario.id || id('gs'),
      entradas: cuerpo.glosario.entradas ?? [],
      creado: cuerpo.glosario.creado || ahora(),
      actualizado: ahora(),
    };

    return NextResponse.json({ glosario: await guardarGlosario(glosario) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo guardar el glosario.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const glosarioId = new URL(request.url).searchParams.get('id');
  if (!glosarioId) return NextResponse.json({ error: 'Falta el identificador.' }, { status: 400 });
  await borrarGlosario(glosarioId);
  return NextResponse.json({ ok: true });
}
