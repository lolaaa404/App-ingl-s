import {
  guardarProyecto,
  listarMemoria,
  obtenerDiccionarios,
  obtenerEstilo,
  obtenerGlosarios,
  obtenerProyecto,
} from '@/lib/almacen/repositorios';
import { traducirSegmentos } from '@/lib/ia/traducir';

export const maxDuration = 300;

interface Contexto {
  params: Promise<{ id: string }>;
}

/**
 * Traduce los segmentos pendientes y devuelve el avance en NDJSON: un objeto
 * JSON por línea. Con documentos largos la traducción tarda minutos, y la
 * traductora necesita ver por dónde va en lugar de mirar una barra parada.
 */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;

  const { indices, aprovecharMemoria = true } = (await request
    .json()
    .catch(() => ({}))) as { indices?: number[]; aprovecharMemoria?: boolean };

  const proyecto = await obtenerProyecto(id);
  if (!proyecto) {
    return Response.json({ error: 'No existe el proyecto.' }, { status: 404 });
  }

  const [estilo, glosarios, diccionarios, memoria] = await Promise.all([
    obtenerEstilo(proyecto.estilo),
    obtenerGlosarios(proyecto.glosarios),
    obtenerDiccionarios(proyecto.diccionarios),
    listarMemoria(),
  ]);

  const codificador = new TextEncoder();

  const flujo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      const enviar = (dato: unknown) => {
        controlador.enqueue(codificador.encode(`${JSON.stringify(dato)}\n`));
      };

      try {
        const resultado = await traducirSegmentos({
          proyecto,
          estilo,
          glosarios,
          diccionarios,
          memoria,
          indices,
          aprovecharMemoria,
          onProgreso: (p) => enviar({ tipo: 'progreso', ...p }),
        });

        const guardado = await guardarProyecto({
          ...proyecto,
          segmentos: resultado.segmentos,
        });

        enviar({
          tipo: 'fin',
          proyecto: guardado,
          avisos: resultado.avisos,
          terminologia: resultado.terminologia,
        });
      } catch (error) {
        enviar({
          tipo: 'error',
          error: error instanceof Error ? error.message : 'Falló la traducción.',
        });
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(flujo, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
