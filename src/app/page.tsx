import Link from 'next/link';
import clsx from 'clsx';
import { NuevoProyecto } from '@/components/NuevoProyecto';
import { Aviso, Barra, BORDE, Panel, SUAVE, Vacio } from '@/components/ui';
import {
  listarDiccionarios,
  listarEstilos,
  listarGlosarios,
  listarMemoria,
  listarProyectos,
} from '@/lib/almacen/repositorios';
import { nombreModelo, proveedorActivo } from '@/lib/ia/modelo';

export const dynamic = 'force-dynamic';

function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function Inicio() {
  const [proyectos, estilos, glosarios, diccionarios, memoria] = await Promise.all([
    listarProyectos(),
    listarEstilos(),
    listarGlosarios(),
    listarDiccionarios(),
    listarMemoria(),
  ]);

  const proveedor = proveedorActivo();

  return (
    <div className="space-y-6">
      {!proveedor && (
        <Aviso tono="atencion">
          Falta configurar la clave del modelo. Hay que copiar <code>.env.example</code> a{' '}
          <code>.env.local</code> y completar <code>GOOGLE_GENERATIVE_AI_API_KEY</code> (Gemini) o{' '}
          <code>AI_GATEWAY_API_KEY</code> (AI Gateway de Vercel). Sin ella se pueden cargar
          documentos, glosarios y memorias y ejecutar el control por reglas, pero no traducir,
          analizar ni usar el OCR.
        </Aviso>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Panel
          titulo="Encargos"
          acciones={
            <span className={clsx('text-xs', SUAVE)}>
              {memoria.length} unidades en memoria · {glosarios.length} glosarios
              {proveedor ? ` · modelo: ${nombreModelo('traduccion')}` : ''}
            </span>
          }
        >
          {proyectos.length === 0 ? (
            <Vacio titulo="Todavía no hay encargos">
              Se empieza subiendo un documento o pegando el texto en el formulario de la derecha.
            </Vacio>
          ) : (
            <ul className={clsx('divide-y', BORDE)}>
              {proyectos.map((p) => {
                const estilo = estilos.find((e) => e.id === p.estilo);
                return (
                  <li key={p.id}>
                    <Link
                      href={`/proyecto/${p.id}`}
                      className="block px-4 py-3 transition-colors hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-medium tracking-tight">{p.nombre}</h3>
                        <span className={clsx('text-xs tabular-nums', SUAVE)}>
                          {fecha(p.actualizado)}
                        </span>
                      </div>

                      <p className={clsx('mt-0.5 text-xs', SUAVE)}>
                        {p.idiomaOrigen === 'en' ? 'Inglés → Español' : 'Español → Inglés'}
                        {estilo ? ` · ${estilo.nombre}` : ''} · {p.segmentos} segmentos
                        {p.confirmados > 0 ? ` · ${p.confirmados} confirmados` : ''}
                      </p>

                      <div className="mt-2 max-w-sm">
                        <Barra valor={p.traducidos} total={p.segmentos} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <NuevoProyecto estilos={estilos} glosarios={glosarios} diccionarios={diccionarios} />
      </div>
    </div>
  );
}
