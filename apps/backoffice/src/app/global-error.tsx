'use client';

import { body, buttonQuiet, card, centered, heading, muted, stack } from '@/styles/ui.css';

import '../styles/global.css';

/**
 * The last boundary: a throw in the root layout itself, where `error.tsx`
 * never renders because it lives *inside* that layout. It replaces the whole
 * document, so it brings its own `<html>` and `<body>`.
 *
 * Reached only when something very early fails, so it stays plain and makes
 * no database or session assumptions.
 */
export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <html lang="es-MX">
      <body>
        <main className={centered}>
          <section className={card} aria-labelledby="global-error-title">
            <div className={stack}>
              <h1 id="global-error-title" className={heading}>
                La consola no pudo cargar
              </h1>
              <p className={body}>
                Es una falla del servidor, no de tu sesión. Vuelve a intentarlo en un momento.
              </p>
              <p className={muted}>Código: {error.digest ?? 'sin código'}</p>
              <button className={buttonQuiet} type="button" onClick={reset}>
                Reintentar
              </button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
