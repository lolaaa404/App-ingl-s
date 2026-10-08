import {
  listarMemoria,
  mutarProyecto,
  obtenerDiccionarios,
  obtenerEstilo,
  obtenerGlosarios,
  obtenerProyecto,
} from '@/lib/almacen/repositorios';
import { traducirSegmentos } from '@/lib/ia/traducir';
import type { Segmento } from '@/lib/tipos';

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

  const { indices, aprovecharMemoria } = (await request
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
        try {
          controlador.enqueue(codificador.encode(`${JSON.stringify(dato)}\n`));
        } catch {
          // El cliente cortó la conexión: la traducción sigue y se guarda igual.
        }
      };

      // Cada lote se guarda al terminar, sobre la versión más reciente del
      // proyecto: un corte a mitad de camino no pierde lo ya traducido y las
      // ediciones hechas mientras tanto en otros segmentos no se pisan.
      const guardarResueltos = async (resueltos: Segmento[]) => {
        const porId = new Map(resueltos.map((s) => [s.id, s]));
        await mutarProyecto(id, (actual) => ({
          ...actual,
          segmentos: actual.segmentos.map((s) => porId.get(s.id) ?? s),
        }));
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
          onLote: guardarResueltos,
        });

        enviar({
          tipo: 'fin',
          proyecto: (await obtenerProyecto(id)) ?? proyecto,
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
