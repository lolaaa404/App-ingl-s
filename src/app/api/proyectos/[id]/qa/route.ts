import { NextResponse } from 'next/server';
import { mutarProyecto, obtenerEstilo, obtenerGlosarios, obtenerProyecto } from '@/lib/almacen/repositorios';
import { controlarCalidad } from '@/lib/ia/qa';

export const maxDuration = 300;

interface Contexto {
  params: Promise<{ id: string }>;
}

/**
 * Control de calidad final. Las reglas se ejecutan siempre; la revisión con
 * modelo es opcional, porque cuesta tiempo y dinero y no siempre hace falta.
 */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;

  try {
    const proyecto = await obtenerProyecto(id);
    if (!proyecto) return NextResponse.json({ error: 'No existe el proyecto.' }, { status: 404 });

    const { conIA = true } = (await request.json().catch(() => ({}))) as { conIA?: boolean };

    const [estilo, glosarios] = await Promise.all([
      obtenerEstilo(proyecto.estilo),
      obtenerGlosarios(proyecto.glosarios),
    ]);

    const qa = await controlarCalidad({ proyecto, estilo, glosarios, conIA });
    const actualizado = await mutarProyecto(id, (actual) => ({ ...actual, qa }));

    return NextResponse.json({ qa, proyecto: actualizado });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo ejecutar el control.' },
      { status: 500 },
    );
  }
}
