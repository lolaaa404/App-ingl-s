'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { AreaTexto, Aviso, BORDE, Boton, Campo, Chip, Entrada, Panel, SUAVE } from './ui';
import type { EstiloTraduccion } from '@/lib/tipos';

/**
 * Editor de estilos. Los predefinidos no se modifican: se duplican y se edita
 * la copia, para que el criterio de fábrica siga disponible como referencia.
 */
export function GestorEstilos({ estilos }: { estilos: EstiloTraduccion[] }) {
  const router = useRouter();
  const [activoId, setActivoId] = useState<string | undefined>(estilos[0]?.id);
  const [borrador, setBorrador] = useState<EstiloTraduccion | null>(null);
  const [mensaje, setMensaje] = useState<{ tono: 'error' | 'exito'; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const activo = estilos.find((e) => e.id === activoId);

  useEffect(() => {
    setBorrador(activo ? structuredClone(activo) : null);
  }, [activo]);

  async function guardar(estilo: EstiloTraduccion) {
    setTrabajando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch('/api/estilos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estilo }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error });
        return;
      }
      setActivoId(cuerpo.estilo.id);
      setMensaje({ tono: 'exito', texto: 'Estilo guardado.' });
      router.refresh();
    } finally {
      setTrabajando(false);
    }
  }

  async function duplicar() {
    if (!borrador) return;
    await guardar({
      ...borrador,
      id: '',
      nombre: `${borrador.nombre} (copia)`,
      predefinido: false,
    });
  }

  async function borrar() {
    if (!activo || activo.predefinido) return;
    if (!window.confirm(`¿Borrar el estilo «${activo.nombre}»?`)) return;
    const respuesta = await fetch(`/api/estilos?id=${activo.id}`, { method: 'DELETE' });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json();
      setMensaje({ tono: 'error', texto: cuerpo.error });
      return;
    }
    setActivoId(estilos.find((e) => e.id !== activo.id)?.id);
    router.refresh();
  }

  function actualizar(cambios: Partial<EstiloTraduccion>) {
    setBorrador((actual) => (actual ? { ...actual, ...cambios } : actual));
  }

  function actualizarReglas(cambios: Partial<EstiloTraduccion['reglas']>) {
    setBorrador((actual) =>
      actual ? { ...actual, reglas: { ...actual.reglas, ...cambios } } : actual,
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <Panel titulo="Estilos de traducción">
        <ul className={clsx('divide-y', BORDE)}>
          {estilos.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setActivoId(e.id)}
                className={clsx(
                  'block w-full px-4 py-2.5 text-left transition-colors',
                  e.id === activoId
                    ? 'bg-[var(--color-acento)]/[0.08]'
                    : 'hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
                )}
              >
                <p className="text-sm font-medium leading-snug">{e.nombre}</p>
                <p className={clsx('mt-0.5 text-[11px]', SUAVE)}>
                  {e.predefinido ? 'predefinido' : 'propio'}
                  {e.esqueleto ? ' · con esqueleto' : ''}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {borrador ? (
        <Panel
          titulo={borrador.nombre}
          acciones={
            <div className="flex items-center gap-2">
              {borrador.predefinido ? (
                <>
                  <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">
                    predefinido, solo lectura
                  </Chip>
                  <Boton variante="principal" onClick={duplicar} disabled={trabajando}>
                    Duplicar para editar
                  </Boton>
                </>
              ) : (
                <>
                  <Boton variante="peligro" onClick={borrar}>
                    Borrar
                  </Boton>
                  <Boton
                    variante="principal"
                    onClick={() => guardar(borrador)}
                    disabled={trabajando}
                  >
                    Guardar cambios
                  </Boton>
                </>
              )}
            </div>
          }
        >
          <fieldset disabled={borrador.predefinido} className="space-y-4 p-4">
            {mensaje && <Aviso tono={mensaje.tono}>{mensaje.texto}</Aviso>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre">
                <Entrada
                  value={borrador.nombre}
                  onChange={(e) => actualizar({ nombre: e.target.value })}
                />
              </Campo>
              <Campo etiqueta="Registro">
                <Entrada
                  value={borrador.registro}
                  onChange={(e) => actualizar({ registro: e.target.value })}
                />
              </Campo>
            </div>

            <Campo etiqueta="Descripción">
              <AreaTexto
                rows={2}
                value={borrador.descripcion}
                onChange={(e) => actualizar({ descripcion: e.target.value })}
              />
            </Campo>

            <Campo
              etiqueta="Instrucciones"
              ayuda="Una por línea. Se le pasan al motor en cada lote de traducción."
            >
              <AreaTexto
                rows={8}
                value={borrador.instrucciones.join('\n')}
                onChange={(e) => actualizar({ instrucciones: e.target.value.split('\n') })}
              />
            </Campo>

            <Campo
              etiqueta="Esqueleto o plantilla"
              ayuda="Fórmulas, encabezados y convenciones de forma de este tipo de traducción. Se usa como referencia al traducir y se puede incluir en la exportación."
            >
              <AreaTexto
                rows={12}
                value={borrador.esqueleto ?? ''}
                onChange={(e) => actualizar({ esqueleto: e.target.value })}
                className="font-mono text-[13px]"
              />
            </Campo>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide">
                Criterios de redacción en español
              </h3>

              <div className="space-y-2.5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-acento)]"
                    checked={borrador.reglas.evitarGerundios}
                    onChange={(e) => actualizarReglas({ evitarGerundios: e.target.checked })}
                  />
                  Limitar el gerundio
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-acento)]"
                    checked={borrador.reglas.evitarVozPasiva}
                    onChange={(e) => actualizarReglas({ evitarVozPasiva: e.target.checked })}
                  />
                  Limitar la voz pasiva
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-acento)]"
                    checked={borrador.reglas.evitarAnglicismos}
                    onChange={(e) => actualizarReglas({ evitarAnglicismos: e.target.checked })}
                  />
                  Evitar anglicismos y calcos
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-acento)]"
                    checked={borrador.reglas.comillasAngulares}
                    onChange={(e) => actualizarReglas({ comillasAngulares: e.target.checked })}
                  />
                  Comillas angulares «…»
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo etiqueta="Gerundios / 100 palabras">
                    <Entrada
                      type="number"
                      min={0}
                      max={10}
                      value={borrador.reglas.maxGerundios100}
                      onChange={(e) =>
                        actualizarReglas({ maxGerundios100: Number(e.target.value) })
                      }
                    />
                  </Campo>

                  <Campo etiqueta="Pasivas / 100 palabras">
                    <Entrada
                      type="number"
                      min={0}
                      max={10}
                      value={borrador.reglas.maxPasivas100}
                      onChange={(e) => actualizarReglas({ maxPasivas100: Number(e.target.value) })}
                    />
                  </Campo>

                  <Campo etiqueta="Adverbios -mente / 10 líneas">
                    <Entrada
                      type="number"
                      min={0}
                      max={10}
                      value={borrador.reglas.maxAdverbiosMenteDiezLineas}
                      onChange={(e) =>
                        actualizarReglas({
                          maxAdverbiosMenteDiezLineas: Number(e.target.value),
                        })
                      }
                    />
                  </Campo>
                </div>
              </div>
            </div>
          </fieldset>
        </Panel>
      ) : (
        <Panel titulo="Sin estilo seleccionado">
          <div className="p-4" />
        </Panel>
      )}
    </div>
  );
}
