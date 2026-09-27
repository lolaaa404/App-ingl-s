import 'server-only';

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { ETIQUETAS } from '../etiquetas';
import type { EstiloTraduccion, Proyecto, Segmento } from '../tipos';

/**
 * Reconstrucción del documento traducido.
 *
 * La segmentación parte los párrafos en oraciones; aquí se vuelven a unir por
 * el número de párrafo de origen, de modo que el resultado conserve la
 * estructura del texto fuente: títulos, listas y tablas en su sitio.
 */

interface ParrafoReconstruido {
  texto: string;
  tipo: Segmento['bloque']['tipo'];
  nivel?: number;
  tabla?: { indice: number; fila: number; columna: number; encabezado?: boolean };
  pagina?: number;
}

export function reconstruirParrafos(
  segmentos: Segmento[],
  campo: 'destino' | 'origen' = 'destino',
): ParrafoReconstruido[] {
  const porParrafo = new Map<number, Segmento[]>();

  for (const s of segmentos) {
    const clave = s.bloque.parrafo;
    const lista = porParrafo.get(clave);
    if (lista) lista.push(s);
    else porParrafo.set(clave, [s]);
  }

  const salida: ParrafoReconstruido[] = [];

  for (const [, grupo] of [...porParrafo.entries()].sort((a, b) => a[0] - b[0])) {
    const ordenados = [...grupo].sort((a, b) => a.indice - b.indice);
    const texto = ordenados
      .map((s) => (campo === 'destino' ? s.destino || s.origen : s.origen))
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!texto) continue;
    const primero = ordenados[0];
    salida.push({
      texto,
      tipo: primero.bloque.tipo,
      nivel: primero.bloque.nivel,
      tabla: primero.bloque.tabla,
      pagina: primero.bloque.pagina,
    });
  }

  return salida;
}

const NIVELES = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

function parrafoDocx(p: ParrafoReconstruido): Paragraph {
  if (p.tipo === 'titulo') {
    return new Paragraph({
      text: p.texto,
      heading: NIVELES[Math.min((p.nivel ?? 1) - 1, 5)] ?? HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
    });
  }

  if (p.tipo === 'lista') {
    return new Paragraph({
      text: p.texto.replace(/^\s*[-*•·]\s*/, ''),
      bullet: { level: Math.max(0, (p.nivel ?? 1) - 1) },
      spacing: { after: 80 },
    });
  }

  if (p.tipo === 'nota' || p.tipo === 'pie') {
    return new Paragraph({
      children: [new TextRun({ text: p.texto, size: 20, italics: true })],
      spacing: { after: 120 },
    });
  }

  if (p.tipo === 'encabezado') {
    return new Paragraph({
      children: [new TextRun({ text: p.texto, bold: true })],
      spacing: { before: 200, after: 100 },
    });
  }

  if (p.tipo === 'sello') {
    return new Paragraph({
      children: [new TextRun({ text: p.texto, italics: true })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
    });
  }

  return new Paragraph({
    text: p.texto,
    spacing: { after: 140, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
  });
}

/** Convierte una serie de celdas consecutivas en una tabla de Word. */
function tablaDocx(celdas: ParrafoReconstruido[]): Table {
  const filas = new Map<number, ParrafoReconstruido[]>();
  for (const c of celdas) {
    const n = c.tabla!.fila;
    const lista = filas.get(n);
    if (lista) lista.push(c);
    else filas.set(n, [c]);
  }

  const columnas = Math.max(...celdas.map((c) => c.tabla!.columna + 1));

  const filasDocx = [...filas.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, celdasFila]) => {
      const ordenadas = [...celdasFila].sort((a, b) => a.tabla!.columna - b.tabla!.columna);
      const celdasCompletas: TableCell[] = [];

      for (let columna = 0; columna < columnas; columna++) {
        const celda = ordenadas.find((c) => c.tabla!.columna === columna);
        celdasCompletas.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: celda?.texto ?? '', bold: celda?.tabla?.encabezado }),
                ],
              }),
            ],
            width: { size: Math.floor(100 / columnas), type: WidthType.PERCENTAGE },
          }),
        );
      }

      return new TableRow({ children: celdasCompletas });
    });

  return new Table({
    rows: filasDocx,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/** Documento traducido, con la estructura del original. */
export async function exportarDocx(
  proyecto: Proyecto,
  estilo: EstiloTraduccion,
  opciones: { incluirEsqueleto?: boolean } = {},
): Promise<Buffer> {
  const parrafos = reconstruirParrafos(proyecto.segmentos);
  const hijos: (Paragraph | Table)[] = [];

  if (opciones.incluirEsqueleto && estilo.esqueleto) {
    hijos.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Plantilla del estilo «${estilo.nombre}» — borrar antes de entregar`,
            bold: true,
            size: 18,
          }),
        ],
      }),
    );
    for (const linea of estilo.esqueleto.split('\n')) {
      hijos.push(
        new Paragraph({ children: [new TextRun({ text: linea, size: 18, color: '888888' })] }),
      );
    }
    hijos.push(new Paragraph({ text: '' }));
  }

  let i = 0;
  while (i < parrafos.length) {
    const p = parrafos[i];

    if (p.tabla) {
      const indiceTabla = p.tabla.indice;
      const celdas: ParrafoReconstruido[] = [];
      while (i < parrafos.length && parrafos[i].tabla?.indice === indiceTabla) {
        celdas.push(parrafos[i]);
        i++;
      }
      hijos.push(tablaDocx(celdas));
      hijos.push(new Paragraph({ text: '' }));
      continue;
    }

    hijos.push(parrafoDocx(p));
    i++;
  }

  const documento = new Document({
    creator: 'Lola · asistente de traducción',
    title: proyecto.nombre,
    sections: [{ properties: {}, children: hijos }],
  });

  return Buffer.from(await Packer.toBuffer(documento));
}

/** Documento bilingüe de revisión: original, traducción y observaciones. */
export async function exportarRevisionDocx(proyecto: Proyecto): Promise<Buffer> {
  const encabezado = new TableRow({
    children: ['N.º', 'Original', 'Traducción', 'Observaciones'].map(
      (t) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: t, bold: true })] })],
        }),
    ),
  });

  const filas = proyecto.segmentos.map((s) => {
    const observaciones = [
      ...s.anotaciones.map(
        (a) => `[${ETIQUETAS[a.etiqueta]?.nombre ?? a.etiqueta}] «${a.fragmento}»: ${a.motivo}`,
      ),
      ...s.justificaciones.map(
        (j) =>
          `[Justificación] ${j.termino} → ${j.eleccion}. ${j.razonamiento} Fuentes: ${j.fuentes
            .map((f) => `${f.titulo}${f.referencia ? `, ${f.referencia}` : ''}`)
            .join('; ')}`,
      ),
      s.comentario ? `[Nota] ${s.comentario}` : '',
    ].filter(Boolean);

    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph(String(s.indice + 1))],
          width: { size: 6, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph(s.origen)],
          width: { size: 31, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph(s.destino)],
          width: { size: 31, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: observaciones.length
            ? observaciones.map(
                (o) => new Paragraph({ children: [new TextRun({ text: o, size: 18 })] }),
              )
            : [new Paragraph('')],
          width: { size: 32, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  });

  const documento = new Document({
    creator: 'Lola · asistente de traducción',
    title: `${proyecto.nombre} — revisión bilingüe`,
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: `${proyecto.nombre} — revisión bilingüe`,
            heading: HeadingLevel.HEADING_1,
          }),
          new Table({
            rows: [encabezado, ...filas],
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(documento));
}

/** Texto plano de la traducción, con los párrafos reconstruidos. */
export function exportarTexto(proyecto: Proyecto): string {
  return reconstruirParrafos(proyecto.segmentos)
    .map((p) => (p.tipo === 'lista' ? `- ${p.texto}` : p.texto))
    .join('\n\n');
}

/** Formato de intercambio sencillo para volcar en otra herramienta. */
export function exportarTsvBilingue(proyecto: Proyecto): string {
  const limpiar = (t: string) => t.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
  const filas = proyecto.segmentos.map((s) =>
    [
      s.indice + 1,
      limpiar(s.origen),
      limpiar(s.destino),
      s.estado,
      s.anotaciones.map((a) => a.etiqueta).join(' '),
    ].join('\t'),
  );
  return ['n\torigen\tdestino\testado\tetiquetas', ...filas].join('\n');
}

/** Informe de control de calidad en Markdown, para archivar o enviar. */
export function exportarInformeQA(proyecto: Proyecto): string {
  const qa = proyecto.qa;
  if (!qa) return '# Sin control de calidad\n\nTodavía no se ejecutó el control.';

  const lineas: string[] = [
    `# Control de calidad — ${proyecto.nombre}`,
    '',
    `Generado: ${new Date(qa.generado).toLocaleString('es')}`,
    `Segmentos revisados: ${qa.segmentosRevisados}`,
    `Hallazgos: ${qa.hallazgos.length} (${qa.totales.alta} de severidad alta, ${qa.totales.media} media, ${qa.totales.baja} baja)`,
    '',
  ];

  if (qa.sintesis) lineas.push('## Valoración general', '', qa.sintesis, '');

  for (const severidad of ['alta', 'media', 'baja'] as const) {
    const grupo = qa.hallazgos.filter((h) => h.severidad === severidad);
    if (!grupo.length) continue;

    lineas.push(`## Severidad ${severidad} (${grupo.length})`, '');
    for (const h of grupo) {
      const ubicacion = h.segmentoIndice !== undefined ? `Segmento ${h.segmentoIndice + 1}` : 'Documento';
      lineas.push(`- **${ubicacion}** · ${h.categoria} · ${h.mensaje}`);
      if (h.fragmento) lineas.push(`  - Fragmento: «${h.fragmento}»`);
      if (h.detalle) lineas.push(`  - ${h.detalle}`);
      if (h.sugerencia) lineas.push(`  - Propuesta: ${h.sugerencia}`);
    }
    lineas.push('');
  }

  return lineas.join('\n');
}
