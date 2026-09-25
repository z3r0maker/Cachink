'use client';

import { colors } from '@xangarro/tokens';

import { marca, monedaMarca, panel, subtitulo, titular } from './aside.css';
import { useCortina } from './cortina';
import { Fachada } from './fachada';

/**
 * The login page's left panel (P-02): the wordmark row, the storefront whose
 * shutter follows the sign-in (see `cortina.tsx`), and the headline pinned to
 * the bottom with `margin-top: auto`. `data-etapa` drives every reaction in
 * CSS. The hero illustration now sits inside the storefront, behind the
 * shutter (ADR-093's asset, reused).
 */
export function PanelAcceso() {
  const { etapa } = useCortina();
  return (
    <aside className={panel} data-etapa={etapa} data-testid="panel-acceso">
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
            style={{ color: `var(--xg-ink, ${colors.black})` }}
          >
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </span>
      </div>

      <Fachada />

      <div style={{ marginTop: 'auto' }}>
        <p className={titular}>Abre tu changarro.</p>
        <p className={subtitulo}>
          Tus ventas, tu caja y tus estados financieros en un solo lugar. Finanzas para
          emprendedores.
        </p>
      </div>
    </aside>
  );
}
