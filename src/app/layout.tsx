import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lola · asistente de traducción',
  description:
    'Traducción contextual español–inglés con memoria de traducción, glosarios, etiquetado de dificultades y control de calidad.',
};

const ENLACES = [
  { href: '/', texto: 'Proyectos' },
  { href: '/memoria', texto: 'Memoria' },
  { href: '/glosarios', texto: 'Glosarios' },
  { href: '/diccionarios', texto: 'Diccionarios' },
  { href: '/estilos', texto: 'Estilos' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased">
        <header className="sin-imprimir sticky top-0 z-30 border-b border-[var(--color-borde)] bg-[var(--color-papel)]/85 backdrop-blur dark:border-[var(--color-borde-noche)] dark:bg-[var(--color-noche)]/85">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">Lola</span>
              <span className="hidden text-xs text-[var(--color-tinta-suave)] sm:inline dark:text-[var(--color-tinta-noche-suave)]">
                asistente de traducción
              </span>
            </Link>

            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {ENLACES.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="rounded-md px-2.5 py-1.5 text-[var(--color-tinta-suave)] transition-colors hover:bg-[var(--color-papel-hundido)] hover:text-[var(--color-tinta)] dark:text-[var(--color-tinta-noche-suave)] dark:hover:bg-[var(--color-noche-elevado)] dark:hover:text-[var(--color-tinta-noche)]"
                >
                  {e.texto}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
