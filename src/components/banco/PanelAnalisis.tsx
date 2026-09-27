'use client';

import clsx from 'clsx';
import { Boton, Chip, Panel, SUAVE, Vacio } from '../ui';
import type { AnalisisFuente } from '@/lib/tipos';

const SISTEMAS: Record<string, string> = {
  'common-law': 'Common law',
  'civil-law': 'Derecho continental',
  mixto: 'Sistema mixto',
  'derecho-internacional': 'Derecho internacional',
  'no-aplica': 'No jurídico',
};

export function PanelAnalisis({
  analisis,
  cargando,
  onAnalizar,
}: {
  analisis?: AnalisisFuente;
  cargando: boolean;
  onAnalizar: () => void;
}) {
  if (!analisis) {
    return (
      <Panel titulo="Lectura del texto fuente">
        <Vacio titulo="Todavía sin analizar">
          Antes de traducir conviene interpretar el documento: qué es, de qué ámbito viene, a qué
          sistema jurídico pertenece y qué términos van a dar problemas.
          <span className="mt-3 block">
            <Boton variante="principal" onClick={onAnalizar} disabled={cargando}>
              {cargando ? 'Leyendo el documento…' : 'Analizar el texto fuente'}
            </Boton>
          </span>
        </Vacio>
      </Panel>
    );
  }

  const ficha: [string, string | undefined][] = [
    ['Tipo', analisis.tipoDocumento],
    ['Ámbito', analisis.ambito],
    ['Sistema', SISTEMAS[analisis.sistemaJuridico] ?? analisis.sistemaJuridico],
    ['Jurisdicción', analisis.jurisdiccion],
    ['Registro', analisis.registro],
    ['Destinatario', analisis.publico],
    ['Finalidad', analisis.proposito],
  ];

  return (
    <Panel
      titulo="Lectura del texto fuente"
      acciones={
        <Boton variante="sutil" onClick={onAnalizar} disabled={cargando}>
          {cargando ? 'Releyendo…' : 'Volver a analizar'}
        </Boton>
      }
    >
      <div className="space-y-4 p-4">
        <p className="text-[15px] leading-relaxed" style={{ fontFamily: 'var(--font-lectura)' }}>
          {analisis.resumen}
        </p>

        <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {ficha
            .filter(([, valor]) => valor)
            .map(([clave, valor]) => (
              <div key={clave} className="flex gap-2">
                <dt className={clsx('shrink-0 text-xs uppercase tracking-wide', SUAVE)}>
                  {clave}
                </dt>
                <dd className="min-w-0">{valor}</dd>
              </div>
            ))}
        </dl>

        {analisis.riesgos.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Términos que exigen decisión
            </h3>
            <ul className="space-y-1.5 text-sm">
              {analisis.riesgos.map((r) => (
                <li key={r.termino} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{r.termino}</span>
                  {r.sinEquivalente && (
                    <Chip className="bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-300 dark:bg-fuchsia-400/15 dark:text-fuchsia-200 dark:ring-fuchsia-400/30">
                      sin equivalente exacto
                    </Chip>
                  )}
                  <span className={clsx('basis-full text-[13px]', SUAVE)}>
                    {r.motivo} <span className="italic">{r.sugerencia}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {analisis.convenciones.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Criterios para todo el documento
            </h3>
            <ul className={clsx('list-disc space-y-0.5 pl-5 text-[13px]', SUAVE)}>
              {analisis.convenciones.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        )}

        {analisis.advertencias.length > 0 && (
          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide">
              Problemas del original
            </h3>
            <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-amber-800 dark:text-amber-300">
              {analisis.advertencias.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
