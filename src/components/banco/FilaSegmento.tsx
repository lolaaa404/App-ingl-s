'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { TextoResaltado } from './TextoResaltado';
import { BORDE, Chip, SUAVE } from '../ui';
import { etiqueta as definicionEtiqueta } from '@/lib/etiquetas';
import type { Anotacion, Segmento } from '@/lib/tipos';

const ESTADOS: Record<Segmento['estado'], { texto: string; clase: string }> = {
  pendiente: { texto: 'Pendiente', clase: 'bg-slate-100 text-slate-600 ring-slate-300 dark:bg-white/10 dark:text-slate-300 dark:ring-white/15' },
  traducido: { texto: 'Traducido', clase: 'bg-sky-100 text-sky-800 ring-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30' },
  editado: { texto: 'Editado', clase: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30' },
  confirmado: { texto: 'Confirmado', clase: 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30' },
};

export function FilaSegmento({
  segmento,
  seleccionado,
  onSeleccionar,
  onCambiar,
  onConfirmar,
  onElegirAnotacion,
}: {
  segmento: Segmento;
  seleccionado: boolean;
  onSeleccionar: () => void;
  onCambiar: (destino: string) => void;
  onConfirmar: () => void;
  onElegirAnotacion: (anotacion: Anotacion) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(segmento.destino);
  const area = useRef<HTMLTextAreaElement>(null);

  // El texto puede cambiar por fuera (traducción, deshacer): se resincroniza.
  useEffect(() => {
    if (!editando) setBorrador(segmento.destino);
  }, [segmento.destino, editando]);

  useEffect(() => {
    if (editando) area.current?.focus();
  }, [editando]);

  function cerrarEdicion() {
    setEditando(false);
    if (borrador !== segmento.destino) onCambiar(borrador);
  }

  const estado = ESTADOS[segmento.estado];
  const marcaTabla = segmento.bloque.tabla;

  return (
    <div
      id={`segmento-${segmento.id}`}
      onClick={onSeleccionar}
      className={clsx(
        'grid grid-cols-1 gap-x-4 gap-y-2 border-b px-4 py-3 transition-colors md:grid-cols-2',
        BORDE,
        seleccionado
          ? 'bg-[var(--color-acento)]/[0.06] dark:bg-[var(--color-acento-noche)]/[0.08]'
          : 'hover:bg-[var(--color-papel-hundido)]/60 dark:hover:bg-white/[0.03]',
      )}
    >
      {/* Cabecera de la fila: número, tipo de bloque y estado */}
      <div className="col-span-full flex flex-wrap items-center gap-2">
        <span className={clsx('font-mono text-xs tabular-nums', SUAVE)}>
          {String(segmento.indice + 1).padStart(3, '0')}
        </span>

        {segmento.bloque.tipo !== 'parrafo' && (
          <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">
            {segmento.bloque.tipo}
            {marcaTabla ? ` ${marcaTabla.fila + 1}·${marcaTabla.columna + 1}` : ''}
          </Chip>
        )}

        {segmento.bloque.pagina && (
          <span className={clsx('text-[11px]', SUAVE)}>pág. {segmento.bloque.pagina}</span>
        )}

        <Chip className={estado.clase}>{estado.texto}</Chip>

        {segmento.desdeMemoria && (
          <Chip className="bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
            memoria 100 %
          </Chip>
        )}

        {!segmento.desdeMemoria && segmento.coincidencias[0] && (
          <Chip
            className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]"
            title={`De la memoria: «${segmento.coincidencias[0].destino}»`}
          >
            memoria {segmento.coincidencias[0].similitud} %
          </Chip>
        )}

        <div className="ml-auto flex items-center gap-1">
          {segmento.destino.trim() && segmento.estado !== 'confirmado' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirmar();
              }}
              className={clsx(
                'rounded-md px-2 py-0.5 text-[11px] font-medium',
                'hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-300',
                SUAVE,
              )}
            >
              Confirmar
            </button>
          )}
        </div>
      </div>

      {/* Texto fuente */}
      <div
        className={clsx(
          'text-[15px] leading-relaxed',
          segmento.bloque.tipo === 'titulo' && 'font-semibold',
        )}
        style={{ fontFamily: 'var(--font-lectura)' }}
      >
        <TextoResaltado
          texto={segmento.origen}
          anotaciones={segmento.anotaciones}
          ambito="origen"
          onElegir={onElegirAnotacion}
        />
      </div>

      {/* Traducción */}
      <div>
        {editando ? (
          <textarea
            ref={area}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onBlur={cerrarEdicion}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setBorrador(segmento.destino);
                setEditando(false);
              }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                cerrarEdicion();
                onConfirmar();
              }
            }}
            rows={2}
            className={clsx(
              'crece w-full resize-none rounded-md border bg-white px-2 py-1.5 text-[15px] leading-relaxed',
              BORDE,
              'focus:border-[var(--color-acento)] focus:outline-none focus:ring-1 focus:ring-[var(--color-acento)]',
              'dark:bg-[var(--color-noche)]',
            )}
            style={{ fontFamily: 'var(--font-lectura)' }}
          />
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSeleccionar();
              setEditando(true);
            }}
            role="textbox"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                setEditando(true);
              }
            }}
            className={clsx(
              'min-h-[1.75rem] cursor-text rounded-md border border-transparent px-2 py-1.5 text-[15px] leading-relaxed',
              'hover:border-[var(--color-borde)] dark:hover:border-[var(--color-borde-noche)]',
              segmento.bloque.tipo === 'titulo' && 'font-semibold',
            )}
            style={{ fontFamily: 'var(--font-lectura)' }}
          >
            {segmento.destino ? (
              <TextoResaltado
                texto={segmento.destino}
                anotaciones={segmento.anotaciones}
                ambito="destino"
                onElegir={onElegirAnotacion}
              />
            ) : (
              <span className={clsx('italic', SUAVE)}>Sin traducir</span>
            )}
          </div>
        )}
      </div>

      {/* Etiquetas del segmento */}
      {(segmento.anotaciones.length > 0 || segmento.justificaciones.length > 0) && (
        <div className="col-span-full flex flex-wrap gap-1.5">
          {segmento.anotaciones.map((a) => {
            const definicion = definicionEtiqueta(a.etiqueta);
            return (
              <button
                key={a.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onElegirAnotacion(a);
                }}
                title={a.motivo}
              >
                <Chip className={definicion.chip}>{definicion.nombre}</Chip>
              </button>
            );
          })}

          {segmento.justificaciones.map((j) => (
            <Chip
              key={j.termino}
              title={j.razonamiento}
              className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]"
            >
              ↳ {j.termino}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
