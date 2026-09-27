'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Aviso, BORDE, Boton, Campo, Chip, Entrada, Panel, Selector, SUAVE, Vacio } from './ui';
import { id as nuevoId } from '@/lib/utiles';
import type { EntradaGlosario, Glosario, Idioma } from '@/lib/tipos';

export function GestorGlosarios({ glosarios }: { glosarios: Glosario[] }) {
  const router = useRouter();
  const [activoId, setActivoId] = useState<string | undefined>(glosarios[0]?.id);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState<{ tono: 'error' | 'exito'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [idiomaImportacion, setIdiomaImportacion] = useState<Idioma>('en');

  const [nueva, setNueva] = useState<Partial<EntradaGlosario>>({
    origen: '',
    destino: '',
    prohibidos: [],
    sensibleContexto: false,
    sinEquivalente: false,
    fuentes: [],
  });

  const activo = glosarios.find((g) => g.id === activoId);

  const entradas = activo
    ? busqueda.trim()
      ? activo.entradas.filter(
          (e) =>
            e.origen.toLowerCase().includes(busqueda.toLowerCase()) ||
            e.destino.toLowerCase().includes(busqueda.toLowerCase()),
        )
      : activo.entradas
    : [];

  async function guardar(glosario: Glosario) {
    setTrabajando(true);
    try {
      const respuesta = await fetch('/api/glosarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glosario }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error });
        return;
      }
      router.refresh();
    } finally {
      setTrabajando(false);
    }
  }

  async function crear() {
    const nombre = window.prompt('Nombre del glosario');
    if (!nombre?.trim()) return;
    const dominio = window.prompt('Ámbito o dominio', 'General') ?? 'General';

    await guardar({
      id: nuevoId('gs'),
      nombre: nombre.trim(),
      dominio,
      entradas: [],
      creado: new Date().toISOString(),
      actualizado: new Date().toISOString(),
    });
    setMensaje({ tono: 'exito', texto: 'Glosario creado.' });
  }

  async function agregarEntrada() {
    if (!activo || !nueva.origen?.trim() || !nueva.destino?.trim()) return;

    const entrada: EntradaGlosario = {
      id: nuevoId('gl'),
      origen: nueva.origen.trim(),
      destino: nueva.destino.trim(),
      idiomaOrigen: (nueva.idiomaOrigen as Idioma) ?? idiomaImportacion,
      contexto: nueva.contexto?.trim() || undefined,
      definicion: nueva.definicion?.trim() || undefined,
      prohibidos: nueva.prohibidos ?? [],
      sensibleContexto: nueva.sensibleContexto ?? false,
      sinEquivalente: nueva.sinEquivalente ?? false,
      fuentes: nueva.fuentes ?? [],
    };

    await guardar({ ...activo, entradas: [...activo.entradas, entrada] });
    setNueva({ origen: '', destino: '', prohibidos: [], sensibleContexto: false, sinEquivalente: false, fuentes: [] });
    setMensaje({ tono: 'exito', texto: 'Entrada añadida.' });
  }

  async function borrarEntrada(entradaId: string) {
    if (!activo) return;
    await guardar({ ...activo, entradas: activo.entradas.filter((e) => e.id !== entradaId) });
  }

  async function importar(archivo: File) {
    if (!activo) return;
    setTrabajando(true);
    setMensaje(null);
    try {
      const datos = new FormData();
      datos.append('archivo', archivo);
      datos.append('glosarioId', activo.id);
      datos.append('idiomaOrigen', idiomaImportacion);

      const respuesta = await fetch('/api/glosarios', { method: 'POST', body: datos });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error ?? 'No se pudo importar.' });
        return;
      }

      setMensaje({
        tono: 'exito',
        texto: `${cuerpo.importadas} entradas importadas. ${(cuerpo.avisos ?? []).join(' ')}`,
      });
      router.refresh();
    } finally {
      setTrabajando(false);
    }
  }

  async function borrarGlosario() {
    if (!activo) return;
    if (!window.confirm(`¿Borrar el glosario «${activo.nombre}» y sus ${activo.entradas.length} entradas?`)) {
      return;
    }
    await fetch(`/api/glosarios?id=${activo.id}`, { method: 'DELETE' });
    setActivoId(glosarios.find((g) => g.id !== activo.id)?.id);
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr_320px]">
      <Panel
        titulo="Glosarios"
        acciones={
          <Boton variante="sutil" onClick={crear}>
            Nuevo
          </Boton>
        }
      >
        <ul className={clsx('divide-y', BORDE)}>
          {glosarios.map((g) => (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => setActivoId(g.id)}
                className={clsx(
                  'block w-full px-4 py-2.5 text-left transition-colors',
                  g.id === activoId
                    ? 'bg-[var(--color-acento)]/[0.08]'
                    : 'hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
                )}
              >
                <p className="text-sm font-medium leading-snug">{g.nombre}</p>
                <p className={clsx('text-[11px]', SUAVE)}>
                  {g.entradas.length} entradas · {g.dominio}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        titulo={activo ? activo.nombre : 'Sin glosario'}
        acciones={
          activo && (
            <div className="flex items-center gap-2">
              <Entrada
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar término…"
                className="h-8 w-40 py-1 text-xs"
              />
              <a href={`/api/glosarios?exportar=${activo.id}`} download>
                <Boton variante="sutil">CSV</Boton>
              </a>
              {activo.id !== 'base-sin-equivalente' && (
                <Boton variante="peligro" onClick={borrarGlosario}>
                  Borrar
                </Boton>
              )}
            </div>
          )
        }
      >
        {!activo ? (
          <Vacio titulo="No hay ningún glosario seleccionado" />
        ) : entradas.length === 0 ? (
          <Vacio titulo="Glosario vacío">
            Se pueden añadir entradas a mano o importar un CSV con columnas de origen y destino.
          </Vacio>
        ) : (
          <ul className={clsx('max-h-[70vh] divide-y overflow-y-auto sutil', BORDE)}>
            {entradas.map((e) => (
              <li key={e.id} className="group px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-medium">{e.origen}</span>
                    <span className={SUAVE}> → </span>
                    <span>{e.destino}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => borrarEntrada(e.id)}
                    className={clsx(
                      'shrink-0 text-[11px] opacity-0 transition-opacity group-hover:opacity-100',
                      'text-red-600 hover:underline dark:text-red-400',
                    )}
                  >
                    borrar
                  </button>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {e.sinEquivalente && (
                    <Chip className="bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-300 dark:bg-fuchsia-400/15 dark:text-fuchsia-200 dark:ring-fuchsia-400/30">
                      sin equivalente exacto
                    </Chip>
                  )}
                  {e.sensibleContexto && (
                    <Chip className="bg-violet-100 text-violet-900 ring-violet-300 dark:bg-violet-400/15 dark:text-violet-200 dark:ring-violet-400/30">
                      depende del contexto
                    </Chip>
                  )}
                  {e.prohibidos.map((p) => (
                    <Chip
                      key={p}
                      className="bg-red-100 text-red-900 ring-red-300 dark:bg-red-400/15 dark:text-red-200 dark:ring-red-400/30"
                    >
                      no usar: {p}
                    </Chip>
                  ))}
                  {e.contexto && (
                    <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">
                      {e.contexto}
                    </Chip>
                  )}
                </div>

                {e.definicion && (
                  <p className={clsx('mt-1 text-[13px] leading-snug', SUAVE)}>{e.definicion}</p>
                )}
                {e.fuentes.length > 0 && (
                  <p className={clsx('mt-1 text-[11px]', SUAVE)}>
                    Fuentes: {e.fuentes.join(' · ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="space-y-6">
        {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

        <Panel titulo="Añadir entrada">
          <div className="space-y-3 p-4">
            <Campo etiqueta="Dirección">
              <Selector
                value={idiomaImportacion}
                onChange={(e) => setIdiomaImportacion(e.target.value as Idioma)}
              >
                <option value="en">Inglés → Español</option>
                <option value="es">Español → Inglés</option>
              </Selector>
            </Campo>

            <Campo etiqueta="Término">
              <Entrada
                value={nueva.origen ?? ''}
                onChange={(e) => setNueva({ ...nueva, origen: e.target.value })}
              />
            </Campo>

            <Campo etiqueta="Equivalente">
              <Entrada
                value={nueva.destino ?? ''}
                onChange={(e) => setNueva({ ...nueva, destino: e.target.value })}
              />
            </Campo>

            <Campo etiqueta="Contexto" ayuda="Rama, ámbito o tipo de documento.">
              <Entrada
                value={nueva.contexto ?? ''}
                onChange={(e) => setNueva({ ...nueva, contexto: e.target.value })}
              />
            </Campo>

            <Campo etiqueta="No usar" ayuda="Traducciones vedadas, separadas por punto y coma.">
              <Entrada
                value={(nueva.prohibidos ?? []).join('; ')}
                onChange={(e) =>
                  setNueva({
                    ...nueva,
                    prohibidos: e.target.value.split(';').map((p) => p.trim()).filter(Boolean),
                  })
                }
              />
            </Campo>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--color-acento)]"
                checked={nueva.sensibleContexto ?? false}
                onChange={(e) => setNueva({ ...nueva, sensibleContexto: e.target.checked })}
              />
              Depende del contexto
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[var(--color-acento)]"
                checked={nueva.sinEquivalente ?? false}
                onChange={(e) => setNueva({ ...nueva, sinEquivalente: e.target.checked })}
              />
              Sin equivalente exacto
            </label>

            <Boton
              variante="principal"
              className="w-full"
              onClick={agregarEntrada}
              disabled={trabajando || !activo || !nueva.origen?.trim() || !nueva.destino?.trim()}
            >
              Añadir
            </Boton>
          </div>
        </Panel>

        <Panel titulo="Importar CSV o TSV">
          <div className="space-y-2 p-4">
            <p className={clsx('text-[13px]', SUAVE)}>
              Columnas reconocidas: origen, destino, contexto, definición, prohibidos y fuentes.
              Las entradas se añaden al glosario seleccionado.
            </p>
            <input
              type="file"
              accept=".csv,.tsv,.txt"
              disabled={trabajando || !activo}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) importar(archivo);
                e.target.value = '';
              }}
              className={clsx('w-full text-sm', SUAVE)}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
}
