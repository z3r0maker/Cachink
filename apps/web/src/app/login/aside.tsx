'use client';

import Image from 'next/image';

import { AnimacionAcceso } from './animation';
import { heroImagen, heroMarco, marca, monedaMarca, panel, subtitulo, titular } from './aside.css';
import { colors } from '@xangarro/tokens';

/**
 * The login page's left panel (P-02): the wordmark row, the looping
 * animation, and the headline pinned to the bottom with `margin-top: auto`.
 * The hero illustration sits between the mark and the stage, as the design
 * has it (ADR-093 reverses ADR-058 §7). It is the handoff's own
 * `hero-taqueria.png`, served as a 52 KB WebP at the asset's 2.5:1.
 */
/** The handoff's illustration, framed as block 2 of the panel (A-12). */
function Hero() {
  return (
    <div className={heroMarco}>
      <Image
        className={heroImagen}
        src="/hero-taqueria.webp"
        alt="Una taquera atiende su puesto con el teléfono en la mano"
        width={1400}
        height={560}
        priority
        sizes="(max-width: 1023px) 0px, 50vw"
      />
    </div>
  );
}

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
            style={{ color: `var(--xg-ink, ${colors.black})` }}
          >
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </span>
      </div>

      <Hero />

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
