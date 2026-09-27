'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import clsx from 'clsx';
import { AreaTexto, Aviso, Boton, Campo, Entrada, Panel, Selector, SUAVE } from './ui';
import { EXTENSIONES_ADMITIDAS } from '@/lib/extraccion/formatos';
import type { Diccionario, EstiloTraduccion, Glosario, Idioma } from '@/lib/tipos';

interface Props {
  estilos: EstiloTraduccion[];
  glosarios: Glosario[];
  diccionarios: Diccionario[];
}

export function NuevoProyecto({ estilos, glosarios, diccionarios }: Props) {
  const router = useRouter();
  const entradaArchivo = useRef<HTMLInputElement>(null);

  const [modo, setModo] = useState<'archivo' | 'texto'>('archivo');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [texto, setTexto] = useState('');
  const [nombre, setNombre] = useState('');
  const [idiomaOrigen, setIdiomaOrigen] = useState<Idioma>('en');
  const [estilo, setEstilo] = useState('general');
  const [seleccionGlosarios, setSeleccionGlosarios] = useState<string[]>(
    glosarios.filter((g) => g.id === 'base-sin-equivalente').map((g) => g.id),
  );
  const [seleccionDiccionarios, setSeleccionDiccionarios] = useState<string[]>([]);
  const [forzarOcr, setForzarOcr] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  const idiomaDestino: Idioma = idiomaOrigen === 'en' ? 'es' : 'en';

  function alternar(lista: string[], valor: string, fijar: (v: string[]) => void) {
    fijar(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setAvisos([]);

    if (modo === 'archivo' && !archivo) {
      setError('Hay que elegir un archivo.');
      return;
    }
    if (modo === 'texto' && !texto.trim()) {
      setError('Hay que pegar el texto que se va a traducir.');
      return;
    }

    setEnviando(true);

    try {
      const datos = new FormData();
      if (modo === 'archivo' && archivo) datos.append('archivo', archivo);
      if (modo === 'texto') datos.append('texto', texto);
      if (nombre.trim()) datos.append('nombre', nombre.trim());
      datos.append('idiomaOrigen', idiomaOrigen);
      datos.append('idiomaDestino', idiomaDestino);
      datos.append('estilo', estilo);
      datos.append('ocr', String(forzarOcr));
      for (const g of seleccionGlosarios) datos.append('glosarios', g);
      for (const d of seleccionDiccionarios) datos.append('diccionarios', d);

      const respuesta = await fetch('/api/proyectos', { method: 'POST', body: datos });
      const cuerpo = await respuesta.json();

      if (!respuesta.ok) {
        setError(cuerpo.error ?? 'No se pudo crear el proyecto.');
        setAvisos(cuerpo.avisos ?? []);
        return;
      }

      router.push(`/proyecto/${cuerpo.proyecto.id}`);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error de red.');
    } finally {
      setEnviando(false);
    }
  }

  const casillaClase = clsx(
    'flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm',
    'hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
  );

  return (
    <Panel titulo="Nuevo encargo">
      <form onSubmit={enviar} className="space-y-5 p-4">
        <div className="flex gap-1 rounded-lg bg-[var(--color-papel-hundido)] p-1 dark:bg-white/5">
          {(['archivo', 'texto'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={clsx(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                modo === m
                  ? 'bg-white shadow-sm dark:bg-[var(--color-noche-elevado)]'
                  : SUAVE,
              )}
            >
              {m === 'archivo' ? 'Subir documento' : 'Pegar texto'}
            </button>
          ))}
        </div>

        {modo === 'archivo' ? (
          <Campo
            etiqueta="Documento"
            ayuda={`Formatos: ${EXTENSIONES_ADMITIDAS.join(' · ')}. Las imágenes y los escaneos pasan por OCR.`}
          >
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const caido = e.dataTransfer.files?.[0];
                if (caido) setArchivo(caido);
              }}
              onClick={() => entradaArchivo.current?.click()}
              className={clsx(
                'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center',
                'border-[var(--color-borde)] hover:border-[var(--color-acento)] dark:border-[var(--color-borde-noche)]',
              )}
            >
              <input
                ref={entradaArchivo}
                type="file"
                className="hidden"
                accept={EXTENSIONES_ADMITIDAS.join(',')}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
              {archivo ? (
                <>
                  <span className="text-sm font-medium">{archivo.name}</span>
                  <span className={clsx('text-xs', SUAVE)}>
                    {(archivo.size / 1024).toFixed(0)} kB · pulsar para cambiar
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">Arrastrar el archivo o pulsar aquí</span>
                  <span className={clsx('text-xs', SUAVE)}>PDF, Word, PowerPoint o imagen</span>
                </>
              )}
            </div>
          </Campo>
        ) : (
          <Campo etiqueta="Texto fuente">
            <AreaTexto
              rows={10}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Pegar aquí el texto que se va a traducir…"
              className="font-[var(--font-lectura)]"
            />
          </Campo>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Dirección">
            <Selector value={idiomaOrigen} onChange={(e) => setIdiomaOrigen(e.target.value as Idioma)}>
              <option value="en">Inglés → Español</option>
              <option value="es">Español → Inglés</option>
            </Selector>
          </Campo>

          <Campo etiqueta="Estilo" ayuda="El análisis del texto puede recomendar otro.">
            <Selector value={estilo} onChange={(e) => setEstilo(e.target.value)}>
              {estilos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </Selector>
          </Campo>
        </div>

        <Campo etiqueta="Nombre del encargo" ayuda="Opcional: si se deja vacío, se usa el del archivo.">
          <Entrada
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Contrato de distribución — Acme"
          />
        </Campo>

        {glosarios.length > 0 && (
          <Campo etiqueta="Glosarios" ayuda="Sus equivalencias mandan sobre el criterio del motor.">
            <div className={clsx('max-h-40 space-y-0.5 overflow-y-auto sutil')}>
              {glosarios.map((g) => (
                <label key={g.id} className={casillaClase}>
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--color-acento)]"
                    checked={seleccionGlosarios.includes(g.id)}
                    onChange={() =>
                      alternar(seleccionGlosarios, g.id, setSeleccionGlosarios)
                    }
                  />
                  <span>
                    {g.nombre}
                    <span className={clsx('ml-1.5 text-xs', SUAVE)}>
                      {g.entradas.length} entradas · {g.dominio}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Campo>
        )}

        {diccionarios.length > 0 && (
          <Campo etiqueta="Diccionarios propios">
            <div className={clsx('max-h-32 space-y-0.5 overflow-y-auto sutil')}>
              {diccionarios.map((d) => (
                <label key={d.id} className={casillaClase}>
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--color-acento)]"
                    checked={seleccionDiccionarios.includes(d.id)}
                    onChange={() =>
                      alternar(seleccionDiccionarios, d.id, setSeleccionDiccionarios)
                    }
                  />
                  <span>
                    {d.nombre}
                    <span className={clsx('ml-1.5 text-xs', SUAVE)}>
                      {d.entradas.length} entradas
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </Campo>
        )}

        {modo === 'archivo' && (
          <label className={casillaClase}>
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--color-acento)]"
              checked={forzarOcr}
              onChange={(e) => setForzarOcr(e.target.checked)}
            />
            <span>
              Forzar OCR
              <span className={clsx('ml-1.5 text-xs', SUAVE)}>
                para PDF escaneados sin capa de texto
              </span>
            </span>
          </label>
        )}

        {error && <Aviso tono="error">{error}</Aviso>}
        {avisos.map((a, i) => (
          <Aviso key={i} tono="atencion">
            {a}
          </Aviso>
        ))}

        <Boton type="submit" variante="principal" disabled={enviando} className="w-full">
          {enviando ? 'Procesando el documento…' : 'Crear encargo'}
        </Boton>
      </form>
    </Panel>
  );
}
