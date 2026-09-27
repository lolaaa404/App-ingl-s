import { NextResponse } from 'next/server';
import { borrarDeMemoria, guardarEnMemoria, listarMemoria } from '@/lib/almacen/repositorios';
import { buscarCoincidencias, construirIndice } from '@/lib/memoria/coincidencias';
import { importarMemoria, memoriaACsv } from '@/lib/importar/tablas';
import type { EntradaMemoria, Idioma } from '@/lib/tipos';

export const maxDuration = 120;

export async function GET(request: Request) {
  const parametros = new URL(request.url).searchParams;
  const consulta = parametros.get('q')?.trim();
  const formato = parametros.get('formato');

  const entradas = await listarMemoria();

  if (formato === 'csv') {
    return new Response(memoriaACsv(entradas), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="memoria-de-traduccion.csv"',
      },
    });
  }

  if (consulta) {
    const idiomaOrigen = (parametros.get('origen') ?? 'en') as Idioma;
    const idiomaDestino = (parametros.get('destino') ?? 'es') as Idioma;
    const indice = construirIndice(entradas, idiomaOrigen, idiomaDestino);
    const coincidencias = buscarCoincidencias(consulta, indice, { limite: 25, umbral: 45 });
    return NextResponse.json({ coincidencias, total: entradas.length });
  }

  const pagina = Number(parametros.get('pagina') ?? 0);
  const porPagina = 100;
  const orden = [...entradas].sort((a, b) => b.actualizado.localeCompare(a.actualizado));

  return NextResponse.json({
    entradas: orden.slice(pagina * porPagina, (pagina + 1) * porPagina),
    total: entradas.length,
    pagina,
    porPagina,
  });
}

/** Alta manual de pares o importación de un archivo CSV/TSV/TMX. */
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
      const idiomaDestino = (String(formulario.get('idiomaDestino') ?? 'es') as Idioma) ?? 'es';
      const contenido = await archivo.text();

      const { entradas, avisos } = importarMemoria(contenido, idiomaOrigen, idiomaDestino);
      const guardadas = await guardarEnMemoria(entradas);

      return NextResponse.json({ guardadas, avisos, total: (await listarMemoria()).length });
    }

    const cuerpo = (await request.json()) as {
      entradas: Omit<EntradaMemoria, 'id' | 'creado' | 'actualizado' | 'usos'>[];
    };
    const guardadas = await guardarEnMemoria(cuerpo.entradas ?? []);

    return NextResponse.json({ guardadas });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo guardar en la memoria.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { ids } = (await request.json()) as { ids: string[] };
  await borrarDeMemoria(ids ?? []);
  return NextResponse.json({ ok: true });
}
