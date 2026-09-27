'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { AreaTexto, Aviso, BORDE, Boton, Campo, Entrada, Panel, Selector, SUAVE, Vacio } from './ui';
import type { EntradaMemoria, Idioma } from '@/lib/tipos';

export function GestorMemoria({
  entradas,
  total,
}: {
  entradas: EntradaMemoria[];
  total: number;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState<{ tono: 'error' | 'exito'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const [nuevoOrigen, setNuevoOrigen] = useState('');
  const [nuevoDestino, setNuevoDestino] = useState('');
  const [nuevoIdioma, setNuevoIdioma] = useState<Idioma>('en');

  const filtradas = busqueda.trim()
    ? entradas.filter(
        (e) =>
          e.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
          e.destino.toLowerCase().includes(busqueda.toLowerCase()),
      )
    : entradas;

  async function importar(archivo: File, idiomaOrigen: Idioma) {
    setTrabajando(true);
    setMensaje(null);
    try {
      const datos = new FormData();
      datos.append('archivo', archivo);
      datos.append('idiomaOrigen', idiomaOrigen);
      datos.append('idiomaDestino', idiomaOrigen === 'en' ? 'es' : 'en');

      const respuesta = await fetch('/api/memoria', { method: 'POST', body: datos });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error ?? 'No se pudo importar.' });
        return;
      }

      setMensaje({
        tono: 'exito',
        texto: `${cuerpo.guardadas} unidades importadas. ${(cuerpo.avisos ?? []).join(' ')}`,
      });
      router.refresh();
    } finally {
      setTrabajando(false);
    }
  }

  async function agregar() {
    if (!nuevoOrigen.trim() || !nuevoDestino.trim()) return;
    setTrabajando(true);

    await fetch('/api/memoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entradas: [
          {
            origen: nuevoOrigen.trim(),
            destino: nuevoDestino.trim(),
            idiomaOrigen: nuevoIdioma,
            idiomaDestino: nuevoIdioma === 'en' ? 'es' : 'en',
          },
        ],
      }),
    });

    setNuevoOrigen('');
    setNuevoDestino('');
    setTrabajando(false);
    setMensaje({ tono: 'exito', texto: 'Unidad guardada.' });
    router.refresh();
  }

  async function borrar() {
    if (!seleccion.length) return;
    setTrabajando(true);
    await fetch('/api/memoria', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: seleccion }),
    });
    setSeleccion([]);
    setTrabajando(false);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Panel
        titulo={
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Memoria de traducción</h2>
            <span className={clsx('text-xs', SUAVE)}>{total} unidades</span>
          </div>
        }
        acciones={
          <div className="flex items-center gap-2">
            <Entrada
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="h-8 w-40 py-1 text-xs"
            />
            {seleccion.length > 0 && (
              <Boton variante="peligro" onClick={borrar} disabled={trabajando}>
                Borrar {seleccion.length}
              </Boton>
            )}
            <a href="/api/memoria?formato=csv" download>
              <Boton variante="sutil">Exportar CSV</Boton>
            </a>
          </div>
        }
      >
        {filtradas.length === 0 ? (
          <Vacio titulo="La memoria está vacía">
            Se llena sola al confirmar segmentos en un encargo, o se importa un CSV, un TSV o un
            archivo TMX de otra herramienta.
          </Vacio>
        ) : (
          <ul className={clsx('max-h-[70vh] divide-y overflow-y-auto sutil', BORDE)}>
            {filtradas.map((e) => (
              <li key={e.id} className="flex gap-3 px-4 py-2.5">
                <input
                  type="checkbox"
                  className="mt-1 accent-[var(--color-acento)]"
                  checked={seleccion.includes(e.id)}
                  onChange={() =>
                    setSeleccion((s) =>
                      s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id],
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{e.origen}</p>
                  <p className={clsx('mt-0.5 text-sm leading-snug', SUAVE)}>{e.destino}</p>
                  <p className={clsx('mt-1 text-[11px]', SUAVE)}>
                    {e.idiomaOrigen} → {e.idiomaDestino}
                    {e.dominio ? ` · ${e.dominio}` : ''}
                    {e.proyecto ? ` · ${e.proyecto}` : ''} · {e.usos} usos
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-6">
        {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

        <Panel titulo="Importar">
          <div className="space-y-3 p-4">
            <p className={clsx('text-[13px]', SUAVE)}>
              Admite CSV y TSV con columnas de origen y destino, y archivos TMX exportados de otra
              herramienta.
            </p>
            <Campo etiqueta="Dirección del archivo">
              <Selector value={nuevoIdioma} onChange={(e) => setNuevoIdioma(e.target.value as Idioma)}>
                <option value="en">Inglés → Español</option>
                <option value="es">Español → Inglés</option>
              </Selector>
            </Campo>
            <input
              type="file"
              accept=".csv,.tsv,.txt,.tmx,.xml"
              disabled={trabajando}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) importar(archivo, nuevoIdioma);
                e.target.value = '';
              }}
              className={clsx('w-full text-sm', SUAVE)}
            />
          </div>
        </Panel>

        <Panel titulo="Añadir una unidad">
          <div className="space-y-3 p-4">
            <Campo etiqueta="Original">
              <AreaTexto
                rows={2}
                value={nuevoOrigen}
                onChange={(e) => setNuevoOrigen(e.target.value)}
              />
            </Campo>
            <Campo etiqueta="Traducción">
              <AreaTexto
                rows={2}
                value={nuevoDestino}
                onChange={(e) => setNuevoDestino(e.target.value)}
              />
            </Campo>
            <Boton
              variante="principal"
              className="w-full"
              onClick={agregar}
              disabled={trabajando || !nuevoOrigen.trim() || !nuevoDestino.trim()}
            >
              Guardar en la memoria
            </Boton>
          </div>
        </Panel>
      </div>
    </div>
  );
}
