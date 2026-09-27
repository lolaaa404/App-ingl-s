import { NextResponse } from 'next/server';
import { borrarProyecto, guardarEnMemoria, mutarProyecto, obtenerProyecto } from '@/lib/almacen/repositorios';
import type { EstadoSegmento, Proyecto, Segmento } from '@/lib/tipos';

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) return NextResponse.json({ error: 'No existe el proyecto.' }, { status: 404 });
  return NextResponse.json({ proyecto });
}

interface CambioSegmento {
  id: string;
  destino?: string;
  estado?: EstadoSegmento;
  comentario?: string;
  /** Quita las anotaciones de un segmento cuando ya se resolvió. */
  limpiarAnotaciones?: boolean;
}

interface CuerpoPatch {
  nombre?: string;
  estilo?: string;
  glosarios?: string[];
  diccionarios?: string[];
  notas?: string;
  segmentos?: CambioSegmento[];
  /** Guarda en la memoria de traducción los segmentos confirmados. */
  volcarAMemoria?: boolean;
}

export async function PATCH(request: Request, { params }: Contexto) {
  const { id } = await params;

  try {
    const cuerpo = (await request.json()) as CuerpoPatch;

    const proyecto = await mutarProyecto(id, (actual): Proyecto => {
      const siguiente: Proyecto = { ...actual };

      if (cuerpo.nombre !== undefined) siguiente.nombre = cuerpo.nombre;
      if (cuerpo.estilo !== undefined) siguiente.estilo = cuerpo.estilo;
      if (cuerpo.glosarios !== undefined) siguiente.glosarios = cuerpo.glosarios;
      if (cuerpo.diccionarios !== undefined) siguiente.diccionarios = cuerpo.diccionarios;
      if (cuerpo.notas !== undefined) siguiente.notas = cuerpo.notas;

      if (cuerpo.segmentos?.length) {
        const cambios = new Map(cuerpo.segmentos.map((c) => [c.id, c]));
        siguiente.segmentos = actual.segmentos.map((s): Segmento => {
          const cambio = cambios.get(s.id);
          if (!cambio) return s;

          const destino = cambio.destino ?? s.destino;
          const cambioDeTexto = cambio.destino !== undefined && cambio.destino !== s.destino;

          return {
            ...s,
            destino,
            comentario: cambio.comentario ?? s.comentario,
            anotaciones: cambio.limpiarAnotaciones ? [] : s.anotaciones,
            estado:
              cambio.estado ??
              (cambioDeTexto && s.estado !== 'confirmado' ? 'editado' : s.estado),
          };
        });
      }

      return siguiente;
    });

    if (cuerpo.volcarAMemoria) {
      const confirmados = proyecto.segmentos.filter(
        (s) => s.estado === 'confirmado' && s.destino.trim(),
      );
      await guardarEnMemoria(
        confirmados.map((s) => ({
          origen: s.origen,
          destino: s.destino,
          idiomaOrigen: proyecto.idiomaOrigen,
          idiomaDestino: proyecto.idiomaDestino,
          estilo: proyecto.estilo,
          proyecto: proyecto.nombre,
          dominio: proyecto.analisis?.ambito,
        })),
      );
      return NextResponse.json({ proyecto, guardadosEnMemoria: confirmados.length });
    }

    return NextResponse.json({ proyecto });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar el proyecto.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Contexto) {
  const { id } = await params;
  await borrarProyecto(id);
  return NextResponse.json({ ok: true });
}
