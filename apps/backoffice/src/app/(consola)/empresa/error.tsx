'use client';

import * as m from '@/styles/mostrador.css';

/**
 * «Empresa»'s error state: inside the rail, so the founder keeps their place.
 * Like the console's catch-all it promises nothing about the cause and hands
 * over the digest that matches the runtime log.
 */
export default function EmpresaError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  return (
    <div className={m.page}>
      <section className={m.hero} aria-labelledby="empresa-error">
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 id="empresa-error" className={m.title}>
          No se pudo cargar
        </h1>
        <p className={m.sub}>
          Vuelve a intentarlo. Si sigue fallando, revisa el registro con este código:{' '}
          {error.digest ?? 'sin código'}.
        </p>
        <div className={m.pad}>
          <button className={m.boton.secundario} type="button" onClick={reset}>
            Reintentar
          </button>
        </div>
      </section>
    </div>
  );
}
