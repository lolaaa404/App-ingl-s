import { NextResponse } from 'next/server';
import { borrarEstilo, guardarEstilo, listarEstilos } from '@/lib/almacen/repositorios';
import { REGLAS_BASE } from '@/lib/estilos/presets';
import { id } from '@/lib/utiles';
import type { EstiloTraduccion } from '@/lib/tipos';

export async function GET() {
  return NextResponse.json({ estilos: await listarEstilos() });
}

export async function POST(request: Request) {
  try {
    const { estilo } = (await request.json()) as { estilo: Partial<EstiloTraduccion> };
    if (!estilo?.nombre) {
      return NextResponse.json({ error: 'Falta el nombre del estilo.' }, { status: 400 });
    }

    const completo: EstiloTraduccion = {
      id: estilo.id || id('es'),
      nombre: estilo.nombre,
      descripcion: estilo.descripcion ?? '',
      registro: estilo.registro ?? 'Neutro',
      instrucciones: (estilo.instrucciones ?? []).filter((i) => i.trim()),
      esqueleto: estilo.esqueleto?.trim() || undefined,
      reglas: { ...REGLAS_BASE, ...estilo.reglas },
      // Al guardar una copia de un preset deja de serlo y se puede editar.
      predefinido: false,
    };

    return NextResponse.json({ estilo: await guardarEstilo(completo) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo guardar el estilo.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const estiloId = new URL(request.url).searchParams.get('id');
  if (!estiloId) return NextResponse.json({ error: 'Falta el identificador.' }, { status: 400 });

  try {
    await borrarEstilo(estiloId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo borrar el estilo.' },
      { status: 400 },
    );
  }
}
