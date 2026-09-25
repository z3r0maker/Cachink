'use client';

import { useEffect, useState } from 'react';

import { Don } from './don';
import * as s from './cargando.css';

const FRASES = [
  'Contando monedas',
  'Cuadrando la caja',
  'Sacando cuentas',
  'Ya casi, ya casi',
] as const;

/** Rotates the loader's line every 1.8 s; a single line if motion is reduced. */
function useFrase(): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % FRASES.length), 1800);
    return () => window.clearInterval(t);
  }, []);
  return FRASES[i] ?? FRASES[0];
}

/**
 * The portal's loading state (ADR-107): a bar across the top, Don Cuentas
 * tossing a coin while he counts, and faint cards where the page will land.
 * The shell stays put; this fills the content area only.
 */
export function DonCargando() {
  const frase = useFrase();
  return (
    <div role="status" aria-live="polite">
      <div className={s.track} aria-hidden="true">
        <span className={s.bar} />
      </div>
      <div className={s.stage}>
        <div className={s.scene} aria-hidden="true">
          <span className={s.coin}>$</span>
          <span className={s.don}>
            <Don pose="contando" size={230} />
          </span>
        </div>
        <span className={s.frase}>{frase}…</span>
        <span className={s.sub}>Don Cuentas está sacando tus números</span>
      </div>
      <div className={s.ghosts} aria-hidden="true">
        <div className={s.ghost} />
        <div className={s.ghost} />
      </div>
    </div>
  );
}

/** The coin that spins inside a busy button («Guardando…»). */
export function MonedaGirando() {
  return <span className={s.miniCoin} aria-hidden="true" />;
}
