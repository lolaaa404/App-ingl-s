'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { BORDE, Boton, Chip, Panel, SUAVE, Vacio } from '../ui';
import { CLASES_SEVERIDAD, NOMBRES_CATEGORIA } from '@/lib/etiquetas';
import type { InformeQA, Severidad } from '@/lib/tipos';

export function PanelQA({
  informe,
  cargando,
  onEjecutar,
  onIr,
  onExportar,
}: {
  informe?: InformeQA;
  cargando: boolean;
  onEjecutar: (conIA: boolean) => void;
  onIr: (segmentoId: string) => void;
  onExportar: () => void;
}) {
  const [filtroSeveridad, setFiltroSeveridad] = useState<Severidad | 'todas'>('todas');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  const acciones = (
    <>
      <Boton variante="sutil" onClick={() => onEjecutar(false)} disabled={cargando}>
        Solo reglas
      </Boton>
      <Boton variante="principal" onClick={() => onEjecutar(true)} disabled={cargando}>
        {cargando ? 'Revisando…' : 'Control completo'}
      </Boton>
      {informe && (
        <Boton variante="sutil" onClick={onExportar}>
          Descargar informe
        </Boton>
      )}
    </>
  );

  if (!informe) {
    return (
      <Panel titulo="Control de calidad" acciones={acciones}>
        <Vacio titulo="Sin control ejecutado">
          «Solo reglas» comprueba cifras, fechas, omisiones, glosario, calcos y criterios de
          redacción al instante. El «control completo» añade una lectura del modelo que contrasta
          sentido y matices contra el original.
        </Vacio>
      </Panel>
    );
  }

  const categorias = Object.keys(informe.totales.porCategoria).sort();

  const visibles = informe.hallazgos.filter(
    (h) =>
      (filtroSeveridad === 'todas' || h.severidad === filtroSeveridad) &&
      (filtroCategoria === 'todas' || h.categoria === filtroCategoria),
  );

  const botonFiltro = (activo: boolean) =>
    clsx(
      'rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors',
      activo
        ? 'bg-[var(--color-acento)] text-white ring-[var(--color-acento)]'
        : `${SUAVE} ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)] hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5`,
    );

  return (
    <Panel titulo="Control de calidad" acciones={acciones}>
      <div className={clsx('space-y-3 border-b p-4', BORDE)}>
        <p className="text-sm">
          <span className="font-medium">{informe.hallazgos.length}</span> hallazgos en{' '}
          {informe.segmentosRevisados} segmentos ·{' '}
          <span className="text-red-700 dark:text-red-400">{informe.totales.alta} graves</span> ·{' '}
          <span className="text-amber-700 dark:text-amber-400">{informe.totales.media} medios</span>{' '}
          · <span className={SUAVE}>{informe.totales.baja} leves</span>
        </p>

        {informe.sintesis && (
          <p className={clsx('text-[13px] leading-relaxed', SUAVE)}>{informe.sintesis}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={botonFiltro(filtroSeveridad === 'todas')}
            onClick={() => setFiltroSeveridad('todas')}
          >
            Todas
          </button>
          {(['alta', 'media', 'baja'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={botonFiltro(filtroSeveridad === s)}
              onClick={() => setFiltroSeveridad(s)}
            >
              {s} ({informe.totales[s]})
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={botonFiltro(filtroCategoria === 'todas')}
            onClick={() => setFiltroCategoria('todas')}
          >
            Todo
          </button>
          {categorias.map((c) => (
            <button
              key={c}
              type="button"
              className={botonFiltro(filtroCategoria === c)}
              onClick={() => setFiltroCategoria(c)}
            >
              {NOMBRES_CATEGORIA[c] ?? c} ({informe.totales.porCategoria[c]})
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <Vacio titulo="Nada que revisar con estos filtros" />
      ) : (
        <ul className={clsx('max-h-[50vh] divide-y overflow-y-auto sutil', BORDE)}>
          {visibles.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => h.segmentoId && onIr(h.segmentoId)}
                disabled={!h.segmentoId}
                className={clsx(
                  'block w-full px-4 py-2.5 text-left transition-colors',
                  h.segmentoId &&
                    'hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Chip className={CLASES_SEVERIDAD[h.severidad]}>{h.severidad}</Chip>
                  <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">
                    {NOMBRES_CATEGORIA[h.categoria] ?? h.categoria}
                  </Chip>
                  <span className={clsx('text-[11px]', SUAVE)}>
                    {h.segmentoIndice !== undefined
                      ? `segmento ${h.segmentoIndice + 1}`
                      : 'documento'}{' '}
                    · {h.origen === 'ia' ? 'lectura del modelo' : 'regla'}
                  </span>
                </div>

                <p className="text-sm leading-snug">{h.mensaje}</p>
                {h.fragmento && (
                  <p className="mt-1 text-[13px]">
                    <span className="rounded bg-[var(--color-papel-hundido)] px-1 dark:bg-white/10">
                      {h.fragmento}
                    </span>
                  </p>
                )}
                {h.detalle && (
                  <p className={clsx('mt-1 whitespace-pre-line text-[13px] leading-snug', SUAVE)}>
                    {h.detalle}
                  </p>
                )}
                {h.sugerencia && (
                  <p className="mt-1 text-[13px]">
                    <span className={SUAVE}>Propuesta: </span>
                    {h.sugerencia}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
