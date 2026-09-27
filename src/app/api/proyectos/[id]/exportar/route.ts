import { NextResponse } from 'next/server';
import { obtenerEstilo, obtenerProyecto } from '@/lib/almacen/repositorios';
import {
  exportarDocx,
  exportarInformeQA,
  exportarRevisionDocx,
  exportarTexto,
  exportarTsvBilingue,
} from '@/lib/exportar/documento';

export const maxDuration = 120;

interface Contexto {
  params: Promise<{ id: string }>;
}

const TIPO_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function nombreArchivo(base: string, extension: string): string {
  const limpio = base
    .replace(/[^\p{L}\p{N}\s.-]/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${limpio || 'traduccion'}.${extension}`;
}

export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  const formato = new URL(request.url).searchParams.get('formato') ?? 'docx';

  const proyecto = await obtenerProyecto(id);
  if (!proyecto) return NextResponse.json({ error: 'No existe el proyecto.' }, { status: 404 });

  const descarga = (
    cuerpo: Buffer | string,
    tipo: string,
    extension: string,
    sufijo = '',
  ): Response => {
    const nombre = nombreArchivo(`${proyecto.nombre}${sufijo}`, extension);
    const datos: BodyInit = typeof cuerpo === 'string' ? cuerpo : new Uint8Array(cuerpo);
    return new Response(datos, {
      headers: {
        'Content-Type': tipo,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(nombre)}"`,
      },
    });
  };

  try {
    switch (formato) {
      case 'docx': {
        const estilo = await obtenerEstilo(proyecto.estilo);
        const incluirEsqueleto =
          new URL(request.url).searchParams.get('esqueleto') === 'true';
        const buffer = await exportarDocx(proyecto, estilo, { incluirEsqueleto });
        return descarga(buffer, TIPO_DOCX, 'docx');
      }
      case 'revision': {
        const buffer = await exportarRevisionDocx(proyecto);
        return descarga(buffer, TIPO_DOCX, 'docx', '-revision-bilingue');
      }
      case 'txt':
        return descarga(exportarTexto(proyecto), 'text/plain; charset=utf-8', 'txt');
      case 'tsv':
        return descarga(
          exportarTsvBilingue(proyecto),
          'text/tab-separated-values; charset=utf-8',
          'tsv',
          '-bilingue',
        );
      case 'qa':
        return descarga(
          exportarInformeQA(proyecto),
          'text/markdown; charset=utf-8',
          'md',
          '-control-de-calidad',
        );
      default:
        return NextResponse.json(
          { error: `Formato no admitido: ${formato}. Opciones: docx, revision, txt, tsv, qa.` },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo exportar.' },
      { status: 500 },
    );
  }
}
