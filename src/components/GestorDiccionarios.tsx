'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Aviso, BORDE, Boton, Campo, Entrada, Panel, SUAVE, Vacio } from './ui';
import type { Diccionario } from '@/lib/tipos';

export function GestorDiccionarios({ diccionarios }: { diccionarios: Diccionario[] }) {
  const router = useRouter();
  const [activoId, setActivoId] = useState<string | undefined>(diccionarios[0]?.id);
  const [nombre, setNombre] = useState('');
  const [trabajando, setTrabajando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tono: 'error' | 'exito'; texto: string } | null>(null);

  const activo = diccionarios.find((d) => d.id === activoId);

  async function subir(archivo: File) {
    setTrabajando(true);
    setMensaje(null);
    try {
      const datos = new FormData();
      datos.append('archivo', archivo);
      if (nombre.trim()) datos.append('nombre', nombre.trim());

      const respuesta = await fetch('/api/diccionarios', { method: 'POST', body: datos });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error ?? 'No se pudo cargar.' });
        return;
      }

      setNombre('');
      setMensaje({ tono: 'exito', texto: `${cuerpo.importadas} entradas cargadas.` });
      setActivoId(cuerpo.diccionario.id);
      router.refresh();
    } finally {
      setTrabajando(false);
    }
  }

  async function borrar(diccionarioId: string) {
    if (!window.confirm('¿Borrar este diccionario?')) return;
    await fetch(`/api/diccionarios?id=${diccionarioId}`, { method: 'DELETE' });
    setActivoId(diccionarios.find((d) => d.id !== diccionarioId)?.id);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_340px]">
      <Panel titulo="Diccionarios propios">
        {diccionarios.length === 0 ? (
          <Vacio titulo="Todavía ninguno" />
        ) : (
          <ul className={clsx('divide-y', BORDE)}>
            {diccionarios.map((d) => (
              <li key={d.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActivoId(d.id)}
                  className={clsx(
                    'flex-1 px-4 py-2.5 text-left transition-colors',
                    d.id === activoId
                      ? 'bg-[var(--color-acento)]/[0.08]'
                      : 'hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
                  )}
                >
                  <p className="text-sm font-medium leading-snug">{d.nombre}</p>
                  <p className={clsx('text-[11px]', SUAVE)}>{d.entradas.length} entradas</p>
                </button>
                <button
                  type="button"
                  onClick={() => borrar(d.id)}
                  className="px-3 text-[11px] text-red-600 hover:underline dark:text-red-400"
                >
                  borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel titulo={activo ? activo.nombre : 'Sin diccionario'}>
        {!activo ? (
          <Vacio titulo="No hay ningún diccionario seleccionado" />
        ) : (
          <ul className={clsx('max-h-[70vh] divide-y overflow-y-auto sutil', BORDE)}>
            {activo.entradas.map((e) => (
              <li key={e.id} className="px-4 py-2.5">
                <p className="text-sm">
                  <span className="font-medium">{e.termino}</span>
                  {e.equivalente && (
                    <>
                      <span className={SUAVE}> → </span>
                      {e.equivalente}
                    </>
                  )}
                </p>
                <p className={clsx('mt-0.5 text-[13px] leading-snug', SUAVE)}>{e.definicion}</p>
                {e.fuente && <p className={clsx('mt-0.5 text-[11px]', SUAVE)}>{e.fuente}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-6">
        {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

        <Panel titulo="Cargar un diccionario">
          <div className="space-y-3 p-4">
            <p className={clsx('text-[13px]', SUAVE)}>
              Sirve como fuente de consulta durante la traducción: cuando un término del diccionario
              aparece en el texto, su definición se le pasa al motor junto con el segmento.
            </p>
            <p className={clsx('text-[13px]', SUAVE)}>
              Admite CSV y TSV con columnas (término, equivalente, definición), listas de texto con
              la forma «término: definición», y documentos de Word o PDF de los que se extraen
              entradas con esa forma.
            </p>

            <Campo etiqueta="Nombre" ayuda="Opcional: por defecto, el del archivo.">
              <Entrada value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </Campo>

            <input
              type="file"
              accept=".csv,.tsv,.txt,.md,.docx,.pdf"
              disabled={trabajando}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) subir(archivo);
                e.target.value = '';
              }}
              className={clsx('w-full text-sm', SUAVE)}
            />

            {trabajando && <Aviso>Procesando el archivo…</Aviso>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
