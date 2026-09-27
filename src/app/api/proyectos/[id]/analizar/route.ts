import { NextResponse } from 'next/server';
import { listarEstilos, mutarProyecto, obtenerProyecto } from '@/lib/almacen/repositorios';
import { analizarFuente } from '@/lib/ia/analizar';

export const maxDuration = 300;

interface Contexto {
  params: Promise<{ id: string }>;
}

/**
 * Interpreta el texto fuente y guarda la ficha de contexto en el proyecto.
 * Si el análisis recomienda otro estilo, se aplica salvo que ya se haya
 * elegido uno distinto del predeterminado a mano.
 */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;

  try {
    const proyecto = await obtenerProyecto(id);
    if (!proyecto) return NextResponse.json({ error: 'No existe el proyecto.' }, { status: 404 });

    const { aplicarEstilo = true } = (await request.json().catch(() => ({}))) as {
      aplicarEstilo?: boolean;
    };

    const estilos = await listarEstilos();
    const texto =
      proyecto.archivo?.textoPlano || proyecto.segmentos.map((s) => s.origen).join('\n\n');

    const analisis = await analizarFuente({
      texto,
      idiomaOrigen: proyecto.idiomaOrigen,
      idiomaDestino: proyecto.idiomaDestino,
      estilos,
    });

    const actualizado = await mutarProyecto(id, (actual) => ({
      ...actual,
      analisis,
      estilo:
        aplicarEstilo && actual.estilo === 'general' ? analisis.estiloRecomendado : actual.estilo,
    }));

    return NextResponse.json({ proyecto: actualizado, analisis });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo analizar el texto.' },
      { status: 500 },
    );
  }
}
