'use client';

import clsx from 'clsx';
import { BORDE, Boton, Chip, Panel, SUAVE, Vacio } from '../ui';
import { CLASES_SEVERIDAD, etiqueta as definicionEtiqueta } from '@/lib/etiquetas';
import type { Segmento } from '@/lib/tipos';

/**
 * Panel de detalle del segmento seleccionado: por qué está marcado, qué
 * alternativas hay, con qué fuentes se justificó la elección y qué dice la
 * memoria de traducción.
 */
export function PanelInspector({
  segmento,
  onAplicar,
}: {
  segmento?: Segmento;
  onAplicar: (texto: string) => void;
}) {
  if (!segmento) {
    return (
      <Panel titulo="Detalle">
        <Vacio titulo="Sin segmento seleccionado">
          Al pulsar sobre una fila aparecen aquí sus etiquetas, las alternativas de traducción y
          las fuentes de cada decisión.
        </Vacio>
      </Panel>
    );
  }

  const sinContenido =
    !segmento.anotaciones.length &&
    !segmento.justificaciones.length &&
    !segmento.coincidencias.length;

  return (
    <Panel
      titulo={`Segmento ${segmento.indice + 1}`}
      acciones={
        segmento.propuesta && segmento.propuesta !== segmento.destino ? (
          <Boton variante="sutil" onClick={() => onAplicar(segmento.propuesta!)}>
            Volver a la propuesta
          </Boton>
        ) : undefined
      }
    >
      <div className="max-h-[60vh] space-y-5 overflow-y-auto p-4 sutil">
        {sinContenido && (
          <p className={clsx('text-sm', SUAVE)}>
            Este segmento no tiene nada marcado: el motor no encontró dificultades y no hay
            coincidencias en la memoria.
          </p>
        )}

        {segmento.anotaciones.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">
              Etiquetas ({segmento.anotaciones.length})
            </h3>
            <ul className="space-y-2.5">
              {segmento.anotaciones.map((a) => {
                const definicion = definicionEtiqueta(a.etiqueta);
                return (
                  <li key={a.id} className={clsx('rounded-lg border p-2.5', BORDE)}>
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Chip className={definicion.chip}>{definicion.nombre}</Chip>
                      <Chip className={CLASES_SEVERIDAD[a.severidad]}>{a.severidad}</Chip>
                      <span className={clsx('text-[11px]', SUAVE)}>
                        {a.ambito === 'origen' ? 'en el original' : 'en la traducción'} ·{' '}
                        {a.fuente === 'ia' ? 'motor' : a.fuente}
                      </span>
                    </div>

                    <p className="text-sm">
                      <span className="rounded bg-[var(--color-papel-hundido)] px-1 font-medium dark:bg-white/10">
                        {a.fragmento}
                      </span>
                    </p>
                    <p className={clsx('mt-1 text-[13px] leading-snug', SUAVE)}>{a.motivo}</p>

                    {a.sugerencia && (
                      <p className="mt-1.5 text-[13px]">
                        <span className={SUAVE}>Propuesta: </span>
                        {a.sugerencia}
                      </p>
                    )}

                    {a.opciones && a.opciones.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {a.opciones.map((opcion, i) => (
                          <li key={i} className="text-[13px]">
                            <span className={SUAVE}>·</span> {opcion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {segmento.justificaciones.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">
              Justificación de la elección
            </h3>
            <ul className="space-y-3">
              {segmento.justificaciones.map((j) => (
                <li key={j.termino} className={clsx('rounded-lg border p-2.5', BORDE)}>
                  <p className="text-sm font-medium">
                    {j.termino} <span className={SUAVE}>→</span> {j.eleccion}
                  </p>
                  <p className={clsx('mt-1 text-[13px] leading-snug', SUAVE)}>{j.razonamiento}</p>

                  {j.fuentes.length > 0 && (
                    <div className="mt-2">
                      <p className={clsx('text-[11px] uppercase tracking-wide', SUAVE)}>Fuentes</p>
                      <ul className="mt-0.5 space-y-0.5 text-[13px]">
                        {j.fuentes.map((f, i) => (
                          <li key={i}>
                            {f.titulo}
                            {f.referencia ? `, ${f.referencia}` : ''}
                            <span className={clsx('ml-1 text-[11px]', SUAVE)}>({f.tipo})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {j.alternativas && j.alternativas.length > 0 && (
                    <div className="mt-2">
                      <p className={clsx('text-[11px] uppercase tracking-wide', SUAVE)}>
                        Descartadas
                      </p>
                      <ul className="mt-0.5 space-y-0.5 text-[13px]">
                        {j.alternativas.map((alt, i) => (
                          <li key={i}>
                            <span className="font-medium">{alt.opcion}</span>
                            <span className={SUAVE}> — {alt.porQueNo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {segmento.coincidencias.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">
              Memoria de traducción
            </h3>
            <ul className="space-y-2">
              {segmento.coincidencias.map((c) => (
                <li key={c.entradaId} className={clsx('rounded-lg border p-2.5', BORDE)}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Chip
                      className={clsx(
                        c.similitud === 100
                          ? 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30'
                          : 'bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
                      )}
                    >
                      {c.similitud} %
                    </Chip>
                    <Boton variante="sutil" onClick={() => onAplicar(c.destino)}>
                      Usar
                    </Boton>
                  </div>
                  <p className={clsx('text-[13px] leading-snug', SUAVE)}>{c.origen}</p>
                  <p className="mt-1 text-[13px] leading-snug">{c.destino}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Panel>
  );
}
