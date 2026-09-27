'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FilaSegmento } from './FilaSegmento';
import { PanelAnalisis } from './PanelAnalisis';
import { PanelInspector } from './PanelInspector';
import { PanelQA } from './PanelQA';
import { AreaTexto, Aviso, Barra, BORDE, Boton, Chip, Entrada, Panel, Selector, SUAVE, Vacio } from '../ui';
import { LISTA_ETIQUETAS } from '@/lib/etiquetas';
import type { Anotacion, Diccionario, EstiloTraduccion, Glosario, Proyecto, Segmento } from '@/lib/tipos';

type Pestana = 'analisis' | 'detalle' | 'calidad' | 'ajustes';
type Filtro = 'todos' | 'pendientes' | 'marcados' | 'confirmados';

interface CambioSegmento {
  id: string;
  destino?: string;
  estado?: Segmento['estado'];
  comentario?: string;
}

export function Banco({
  proyectoInicial,
  estilos,
  glosarios,
  diccionarios,
}: {
  proyectoInicial: Proyecto;
  estilos: EstiloTraduccion[];
  glosarios: Glosario[];
  diccionarios: Diccionario[];
}) {
  const [proyecto, setProyecto] = useState(proyectoInicial);
  const [seleccionado, setSeleccionado] = useState<string | undefined>(
    proyectoInicial.segmentos[0]?.id,
  );
  const [pestana, setPestana] = useState<Pestana>(
    proyectoInicial.analisis ? 'detalle' : 'analisis',
  );

  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>('todas');

  const [analizando, setAnalizando] = useState(false);
  const [traduciendo, setTraduciendo] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [progreso, setProgreso] = useState<{ hechos: number; total: number } | null>(null);
  const [mensaje, setMensaje] = useState<{ tono: 'info' | 'error' | 'exito' | 'atencion'; texto: string } | null>(null);

  // Las ediciones se acumulan y se guardan juntas para no disparar una
  // petición por pulsación de tecla.
  const pendientesDeGuardar = useRef(new Map<string, CambioSegmento>());
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const estilo = estilos.find((e) => e.id === proyecto.estilo);

  const totales = useMemo(() => {
    const s = proyecto.segmentos;
    return {
      total: s.length,
      traducidos: s.filter((x) => x.estado !== 'pendiente').length,
      confirmados: s.filter((x) => x.estado === 'confirmado').length,
      marcados: s.filter((x) => x.anotaciones.length > 0).length,
      pendientes: s.filter((x) => x.estado === 'pendiente').length,
    };
  }, [proyecto.segmentos]);

  const visibles = useMemo(() => {
    const consulta = busqueda.trim().toLowerCase();

    return proyecto.segmentos.filter((s) => {
      if (filtro === 'pendientes' && s.estado !== 'pendiente') return false;
      if (filtro === 'marcados' && s.anotaciones.length === 0) return false;
      if (filtro === 'confirmados' && s.estado !== 'confirmado') return false;

      if (filtroEtiqueta !== 'todas' && !s.anotaciones.some((a) => a.etiqueta === filtroEtiqueta)) {
        return false;
      }

      if (consulta) {
        const enTexto =
          s.origen.toLowerCase().includes(consulta) || s.destino.toLowerCase().includes(consulta);
        if (!enTexto) return false;
      }

      return true;
    });
  }, [proyecto.segmentos, filtro, filtroEtiqueta, busqueda]);

  /* ---------------------------------------------------------------- */
  /* Guardado                                                          */
  /* ---------------------------------------------------------------- */

  const vaciarCola = useCallback(async () => {
    const cambios = [...pendientesDeGuardar.current.values()];
    if (!cambios.length) return;
    pendientesDeGuardar.current.clear();

    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentos: cambios }),
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json();
        setMensaje({ tono: 'error', texto: cuerpo.error ?? 'No se pudo guardar.' });
      }
    } catch {
      setMensaje({ tono: 'error', texto: 'No se pudo guardar: falló la conexión.' });
    }
  }, [proyecto.id]);

  const encolar = useCallback(
    (cambio: CambioSegmento) => {
      const previo = pendientesDeGuardar.current.get(cambio.id) ?? { id: cambio.id };
      pendientesDeGuardar.current.set(cambio.id, { ...previo, ...cambio });

      if (temporizador.current) clearTimeout(temporizador.current);
      temporizador.current = setTimeout(vaciarCola, 800);
    },
    [vaciarCola],
  );

  const cambiarSegmento = useCallback(
    (id: string, destino: string) => {
      setProyecto((actual) => ({
        ...actual,
        segmentos: actual.segmentos.map((s) =>
          s.id === id
            ? { ...s, destino, estado: s.estado === 'confirmado' ? 'confirmado' : 'editado' }
            : s,
        ),
      }));
      encolar({ id, destino });
    },
    [encolar],
  );

  const confirmarSegmento = useCallback(
    (id: string) => {
      setProyecto((actual) => ({
        ...actual,
        segmentos: actual.segmentos.map((s) =>
          s.id === id ? { ...s, estado: 'confirmado' } : s,
        ),
      }));
      encolar({ id, estado: 'confirmado' });
    },
    [encolar],
  );

  /* ---------------------------------------------------------------- */
  /* Acciones del encargo                                              */
  /* ---------------------------------------------------------------- */

  async function analizar() {
    setAnalizando(true);
    setMensaje(null);
    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/analizar`, { method: 'POST' });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error });
        return;
      }
      setProyecto(cuerpo.proyecto);
      setMensaje({ tono: 'exito', texto: 'Texto analizado.' });
    } catch {
      setMensaje({ tono: 'error', texto: 'Falló la conexión al analizar.' });
    } finally {
      setAnalizando(false);
    }
  }

  async function traducir(indices?: number[]) {
    await vaciarCola();
    setTraduciendo(true);
    setMensaje(null);
    setProgreso({ hechos: 0, total: indices?.length ?? totales.pendientes });

    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/traducir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ indices }),
      });

      if (!respuesta.body) throw new Error('El servidor no devolvió contenido.');

      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();
      let resto = '';

      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;

        resto += decodificador.decode(value, { stream: true });
        const lineas = resto.split('\n');
        resto = lineas.pop() ?? '';

        for (const linea of lineas) {
          if (!linea.trim()) continue;
          const evento = JSON.parse(linea);

          if (evento.tipo === 'progreso') {
            setProgreso({ hechos: evento.hechos, total: evento.total });
            if (evento.aviso) setMensaje({ tono: 'atencion', texto: evento.aviso });
          } else if (evento.tipo === 'fin') {
            setProyecto(evento.proyecto);
            setMensaje(
              evento.avisos?.length
                ? { tono: 'atencion', texto: evento.avisos.join(' · ') }
                : { tono: 'exito', texto: 'Traducción terminada.' },
            );
          } else if (evento.tipo === 'error') {
            setMensaje({ tono: 'error', texto: evento.error });
          }
        }
      }
    } catch (error) {
      setMensaje({
        tono: 'error',
        texto: error instanceof Error ? error.message : 'Falló la traducción.',
      });
    } finally {
      setTraduciendo(false);
      setProgreso(null);
    }
  }

  async function ejecutarQA(conIA: boolean) {
    await vaciarCola();
    setRevisando(true);
    setPestana('calidad');
    setMensaje(null);

    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conIA }),
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) {
        setMensaje({ tono: 'error', texto: cuerpo.error });
        return;
      }
      setProyecto(cuerpo.proyecto);
    } catch {
      setMensaje({ tono: 'error', texto: 'Falló la conexión durante el control.' });
    } finally {
      setRevisando(false);
    }
  }

  async function volcarAMemoria() {
    await vaciarCola();
    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volcarAMemoria: true }),
      });
      const cuerpo = await respuesta.json();
      setMensaje({
        tono: 'exito',
        texto: `${cuerpo.guardadosEnMemoria ?? 0} segmentos confirmados guardados en la memoria de traducción.`,
      });
    } catch {
      setMensaje({ tono: 'error', texto: 'No se pudo guardar en la memoria.' });
    }
  }

  async function cambiarEstilo(nuevoEstilo: string) {
    setProyecto((actual) => ({ ...actual, estilo: nuevoEstilo }));
    await fetch(`/api/proyectos/${proyecto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estilo: nuevoEstilo }),
    });
  }

  async function cambiarRecursos(campo: 'glosarios' | 'diccionarios', ids: string[]) {
    setProyecto((actual) => ({ ...actual, [campo]: ids }));
    await fetch(`/api/proyectos/${proyecto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: ids }),
    });
  }

  function irASegmento(id: string) {
    setSeleccionado(id);
    setPestana('detalle');
    document.getElementById(`segmento-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function elegirAnotacion(anotacion: Anotacion, segmentoId: string) {
    setSeleccionado(segmentoId);
    setPestana('detalle');
    void anotacion;
  }

  const segmentoActual = proyecto.segmentos.find((s) => s.id === seleccionado);

  const botonFiltro = (activo: boolean) =>
    clsx(
      'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors',
      activo
        ? 'bg-[var(--color-acento)] text-white ring-[var(--color-acento)]'
        : `${SUAVE} ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)] hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5`,
    );

  return (
    <div className="space-y-4">
      {/* Barra del encargo */}
      <Panel className="sin-imprimir">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{proyecto.nombre}</h1>
            <p className={clsx('mt-0.5 text-xs', SUAVE)}>
              {proyecto.idiomaOrigen === 'en' ? 'Inglés → Español' : 'Español → Inglés'} ·{' '}
              {totales.total} segmentos · {totales.traducidos} traducidos ·{' '}
              {totales.confirmados} confirmados
              {proyecto.archivo ? ` · ${proyecto.archivo.nombre}` : ''}
            </p>
          </div>

          <Selector
            value={proyecto.estilo}
            onChange={(e) => cambiarEstilo(e.target.value)}
            className="w-auto min-w-44"
          >
            {estilos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </Selector>

          <div className="flex flex-wrap items-center gap-2">
            <Boton onClick={analizar} disabled={analizando || traduciendo}>
              {analizando ? 'Analizando…' : proyecto.analisis ? 'Releer fuente' : 'Analizar fuente'}
            </Boton>

            <Boton
              variante="principal"
              onClick={() => traducir()}
              disabled={traduciendo || totales.pendientes === 0}
            >
              {traduciendo
                ? 'Traduciendo…'
                : `Traducir ${totales.pendientes} pendientes`}
            </Boton>

            <Boton onClick={() => ejecutarQA(true)} disabled={revisando || traduciendo}>
              {revisando ? 'Revisando…' : 'Control de calidad'}
            </Boton>

            <Boton onClick={volcarAMemoria} disabled={totales.confirmados === 0}>
              Guardar en memoria
            </Boton>

            <Selector
              value=""
              onChange={(e) => {
                if (!e.target.value) return;
                window.open(
                  `/api/proyectos/${proyecto.id}/exportar?formato=${e.target.value}`,
                  '_blank',
                );
                e.target.value = '';
              }}
              className="w-auto"
            >
              <option value="">Exportar…</option>
              <option value="docx">Traducción (Word)</option>
              <option value="revision">Revisión bilingüe (Word)</option>
              <option value="txt">Texto plano</option>
              <option value="tsv">Bilingüe (TSV)</option>
              <option value="qa">Informe de calidad</option>
            </Selector>
          </div>

          <div className="w-full">
            <Barra
              valor={progreso ? progreso.hechos : totales.traducidos}
              total={progreso ? progreso.total : totales.total}
            />
          </div>
        </div>
      </Panel>

      {mensaje && (
        <Aviso tono={mensaje.tono} className="sin-imprimir">
          {mensaje.texto}
        </Aviso>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Banco bilingüe */}
        <Panel
          titulo={
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">Banco bilingüe</h2>
              <span className={clsx('text-xs', SUAVE)}>
                {visibles.length} de {totales.total}
              </span>
            </div>
          }
          acciones={
            <div className="flex flex-wrap items-center gap-2">
              <Entrada
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en el texto…"
                className="h-8 w-44 py-1 text-xs"
              />
              <Selector
                value={filtroEtiqueta}
                onChange={(e) => setFiltroEtiqueta(e.target.value)}
                className="h-8 w-auto py-1 text-xs"
              >
                <option value="todas">Todas las etiquetas</option>
                {LISTA_ETIQUETAS.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </Selector>
            </div>
          }
        >
          <div className={clsx('flex flex-wrap gap-1.5 border-b px-4 py-2.5', BORDE)}>
            {([
              ['todos', `Todos (${totales.total})`],
              ['pendientes', `Pendientes (${totales.pendientes})`],
              ['marcados', `Marcados (${totales.marcados})`],
              ['confirmados', `Confirmados (${totales.confirmados})`],
            ] as const).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                className={botonFiltro(filtro === valor)}
                onClick={() => setFiltro(valor)}
              >
                {texto}
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <Vacio titulo="Ningún segmento coincide con el filtro" />
          ) : (
            <div className="max-h-[calc(100vh-18rem)] overflow-y-auto sutil">
              {visibles.map((s) => (
                <FilaSegmento
                  key={s.id}
                  segmento={s}
                  seleccionado={s.id === seleccionado}
                  onSeleccionar={() => setSeleccionado(s.id)}
                  onCambiar={(destino) => cambiarSegmento(s.id, destino)}
                  onConfirmar={() => confirmarSegmento(s.id)}
                  onElegirAnotacion={(a) => elegirAnotacion(a, s.id)}
                />
              ))}
            </div>
          )}
        </Panel>

        {/* Panel lateral */}
        <div className="space-y-4">
          <div
            className={clsx(
              'sin-imprimir flex gap-1 rounded-lg bg-[var(--color-papel-hundido)] p-1 dark:bg-white/5',
            )}
          >
            {([
              ['analisis', 'Fuente'],
              ['detalle', 'Detalle'],
              ['calidad', 'Calidad'],
              ['ajustes', 'Recursos'],
            ] as const).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setPestana(valor)}
                className={clsx(
                  'flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  pestana === valor
                    ? 'bg-white shadow-sm dark:bg-[var(--color-noche-elevado)]'
                    : SUAVE,
                )}
              >
                {texto}
              </button>
            ))}
          </div>

          {pestana === 'analisis' && (
            <PanelAnalisis
              analisis={proyecto.analisis}
              cargando={analizando}
              onAnalizar={analizar}
            />
          )}

          {pestana === 'detalle' && (
            <>
              <PanelInspector
                segmento={segmentoActual}
                onAplicar={(texto) => segmentoActual && cambiarSegmento(segmentoActual.id, texto)}
              />
              {segmentoActual && (
                <Panel titulo="Nota de la traductora">
                  <div className="p-4">
                    <AreaTexto
                      rows={3}
                      defaultValue={segmentoActual.comentario ?? ''}
                      placeholder="Anotación para la revisión…"
                      onBlur={(e) => encolar({ id: segmentoActual.id, comentario: e.target.value })}
                    />
                    <Boton
                      className="mt-2 w-full"
                      onClick={() => traducir([segmentoActual.indice])}
                      disabled={traduciendo}
                    >
                      Volver a traducir este segmento
                    </Boton>
                  </div>
                </Panel>
              )}
            </>
          )}

          {pestana === 'calidad' && (
            <PanelQA
              informe={proyecto.qa}
              cargando={revisando}
              onEjecutar={ejecutarQA}
              onIr={irASegmento}
              onExportar={() =>
                window.open(`/api/proyectos/${proyecto.id}/exportar?formato=qa`, '_blank')
              }
            />
          )}

          {pestana === 'ajustes' && (
            <Panel titulo="Recursos del encargo">
              <div className="space-y-4 p-4">
                {estilo && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide">
                      Estilo: {estilo.nombre}
                    </h3>
                    <p className={clsx('mt-1 text-[13px]', SUAVE)}>{estilo.descripcion}</p>
                    <ul className={clsx('mt-2 list-disc space-y-1 pl-4 text-[13px]', SUAVE)}>
                      {estilo.instrucciones.slice(0, 4).map((i, n) => (
                        <li key={n}>{i}</li>
                      ))}
                    </ul>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {estilo.reglas.evitarGerundios && <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">gerundios limitados</Chip>}
                      {estilo.reglas.evitarVozPasiva && <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">pasiva limitada</Chip>}
                      <Chip className="bg-transparent ring-[var(--color-borde)] dark:ring-[var(--color-borde-noche)]">
                        {estilo.reglas.maxAdverbiosMenteDiezLineas} adverbio/10 líneas
                      </Chip>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
                    Glosarios
                  </h3>
                  <div className="space-y-0.5">
                    {glosarios.map((g) => (
                      <label key={g.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-[var(--color-acento)]"
                          checked={proyecto.glosarios.includes(g.id)}
                          onChange={(e) =>
                            cambiarRecursos(
                              'glosarios',
                              e.target.checked
                                ? [...proyecto.glosarios, g.id]
                                : proyecto.glosarios.filter((x) => x !== g.id),
                            )
                          }
                        />
                        <span>
                          {g.nombre}
                          <span className={clsx('ml-1 text-xs', SUAVE)}>
                            {g.entradas.length}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {diccionarios.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
                      Diccionarios
                    </h3>
                    <div className="space-y-0.5">
                      {diccionarios.map((d) => (
                        <label key={d.id} className="flex cursor-pointer items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="mt-0.5 accent-[var(--color-acento)]"
                            checked={proyecto.diccionarios.includes(d.id)}
                            onChange={(e) =>
                              cambiarRecursos(
                                'diccionarios',
                                e.target.checked
                                  ? [...proyecto.diccionarios, d.id]
                                  : proyecto.diccionarios.filter((x) => x !== d.id),
                              )
                            }
                          />
                          <span>
                            {d.nombre}
                            <span className={clsx('ml-1 text-xs', SUAVE)}>
                              {d.entradas.length}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
                    Leyenda de etiquetas
                  </h3>
                  <ul className="space-y-1.5">
                    {LISTA_ETIQUETAS.map((e) => (
                      <li key={e.id} className="text-[13px]">
                        <span className={clsx('rounded px-1', e.clase, e.negrita && 'font-semibold')}>
                          {e.nombre}
                        </span>
                        <span className={clsx('ml-1.5', SUAVE)}>{e.descripcion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
