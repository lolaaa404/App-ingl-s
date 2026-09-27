import clsx from 'clsx';
import type { ReactNode } from 'react';

/** Primitivas de interfaz compartidas por todas las pantallas. */

export const BORDE = 'border-[var(--color-borde)] dark:border-[var(--color-borde-noche)]';
export const SUAVE =
  'text-[var(--color-tinta-suave)] dark:text-[var(--color-tinta-noche-suave)]';
export const SUPERFICIE =
  'bg-white dark:bg-[var(--color-noche-elevado)]';

export function Panel({
  children,
  className,
  titulo,
  acciones,
}: {
  children: ReactNode;
  className?: string;
  titulo?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <section className={clsx('rounded-xl border', BORDE, SUPERFICIE, className)}>
      {(titulo || acciones) && (
        <header
          className={clsx(
            'flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3',
            BORDE,
          )}
        >
          {typeof titulo === 'string' ? (
            <h2 className="text-sm font-semibold tracking-tight">{titulo}</h2>
          ) : (
            titulo
          )}
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

type VarianteBoton = 'principal' | 'normal' | 'sutil' | 'peligro';

const VARIANTES: Record<VarianteBoton, string> = {
  principal:
    'bg-[var(--color-acento)] text-white hover:bg-[var(--color-acento-claro)] disabled:bg-[var(--color-acento)]/50',
  normal: `border ${BORDE} bg-transparent hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5`,
  sutil: 'bg-transparent hover:bg-[var(--color-papel-hundido)] dark:hover:bg-white/5',
  peligro:
    'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10',
};

export function Boton({
  children,
  variante = 'normal',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBoton }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-acento)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTES[variante],
        className,
      )}
    >
      {children}
    </button>
  );
}

const CONTROL = clsx(
  'w-full rounded-lg border px-3 py-2 text-sm',
  BORDE,
  'bg-white dark:bg-[var(--color-noche)]',
  'focus:border-[var(--color-acento)] focus:outline-none focus:ring-1 focus:ring-[var(--color-acento)]',
);

export function Campo({
  etiqueta,
  ayuda,
  children,
  className,
}: {
  etiqueta: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx('block', className)}>
      <span className="mb-1.5 block text-xs font-medium tracking-wide uppercase">{etiqueta}</span>
      {children}
      {ayuda && <span className={clsx('mt-1 block text-xs', SUAVE)}>{ayuda}</span>}
    </label>
  );
}

export function Entrada(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(CONTROL, props.className)} />;
}

export function AreaTexto(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx(CONTROL, props.className)} />;
}

export function Selector(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx(CONTROL, 'pr-8', props.className)} />;
}

export function Chip({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Aviso({
  children,
  tono = 'info',
  className,
}: {
  children: ReactNode;
  tono?: 'info' | 'error' | 'exito' | 'atencion';
  className?: string;
}) {
  const tonos = {
    info: `border ${BORDE} bg-[var(--color-papel-hundido)] dark:bg-white/5`,
    error:
      'border border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200',
    exito:
      'border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
    atencion:
      'border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
  };

  return (
    <div className={clsx('rounded-lg px-3 py-2 text-sm', tonos[tono], className)}>{children}</div>
  );
}

export function Vacio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className={clsx('px-4 py-12 text-center')}>
      <p className="text-sm font-medium">{titulo}</p>
      {children && <p className={clsx('mx-auto mt-1 max-w-md text-sm', SUAVE)}>{children}</p>}
    </div>
  );
}

export function Barra({ valor, total }: { valor: number; total: number }) {
  const porcentaje = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-papel-hundido)] dark:bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--color-acento)] transition-[width] duration-300 dark:bg-[var(--color-acento-noche)]"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className={clsx('shrink-0 text-xs tabular-nums', SUAVE)}>{porcentaje} %</span>
    </div>
  );
}
