'use client';

import { AnimacionAcceso } from './animation';
import { marca, monedaMarca, panel, subtitulo, titular } from './aside.css';

/**
 * The login page's left panel (P-02): the wordmark row, the looping
 * animation, and the headline pinned to the bottom with `margin-top: auto`.
 * The design file also places a hero image between the mark and the stage;
 * ADR-058 removed it — the animation gets the room instead.
 */
export function PanelAcceso() {
  return (
    <aside className={panel}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className={marca}>XANGARRO!</span>
        <span className={monedaMarca} aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="60%"
            height="60%"
            fill="none"
            stroke="currentColor"
            strokeWidth={4.6}
            strokeLinecap="butt"
            style={{ color: 'var(--xg-ink, #0D0D0D)' }}
          >
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </span>
      </div>

      <AnimacionAcceso data-testid="animacion-acceso" />

      <div>
        <h1 className={titular}>Finanzas para emprendedores.</h1>
        <p className={subtitulo}>
          Registra tus ventas y gastos desde el mostrador. Nosotros armamos tus estados financieros.
        </p>
      </div>
    </aside>
  );
}
