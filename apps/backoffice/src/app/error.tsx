'use client';

import { body, buttonQuiet, card, centered, heading, muted, stack } from '@/styles/ui.css';

/**
 * The console's catch-all: anything a page or action throws without handling
 * it lands here instead of Next's unstyled error page.
 *
 * React redacts `error.message` in production and leaves only `digest`, so
 * this screen deliberately promises nothing about the cause — it hands over
 * the digest, which matches the line in the deployment's runtime logs. The
 * failures we can actually name are caught where they happen and shown on
 * the form itself (`server/auth/infra-failure.ts`).
 */
export default function ConsoleError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <main className={centered}>
      <section className={card} aria-labelledby="error-title">
        <div className={stack}>
          <h1 id="error-title" className={heading}>
            Algo salió mal
          </h1>
          <p className={body}>
            La consola no pudo completar esa operación. Vuelve a intentarlo; si sigue fallando,
            avisa al equipo con el código de abajo.
          </p>
          <p className={muted}>Código: {error.digest ?? 'sin código'}</p>
          <button className={buttonQuiet} type="button" onClick={reset}>
            Reintentar
          </button>
        </div>
      </section>
    </main>
  );
}
