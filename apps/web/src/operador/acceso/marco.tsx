'use client';

import type { ReactNode } from 'react';

import { Don, type DonPose } from '@/components/don/don';

import { Coin, Icon } from '../../shell/icon';
import * as a from './acceso.css';

/** The design's caja glyph (a register with keys). */
const CAJA =
  'M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM8 7h8M8 11h2M14 11h2M8 15h2M14 15h2';
/** A monitor: this computer, before it is a caja. */
const PANTALLA =
  'M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM8 21h8M12 17v4';

export interface MarcoProps {
  /** Don's pose; `null` keeps the yellow half without him (a dialog has him). */
  readonly pose: DonPose | null;
  readonly mensaje: string | null;
  /** The bubble is the page's heading (DS-08: «La caja ya está abierta en otra pestaña.»). */
  readonly mensajeTitulo?: boolean;
  /** The chip at the bottom: «Caja 1» once linked, «Esta computadora» before. */
  readonly chip: string;
  readonly chipSub: string;
  readonly vinculada: boolean;
  readonly children: ReactNode;
}

function Burbuja(p: {
  readonly pose: DonPose;
  readonly mensaje: string | null;
  readonly titulo: boolean;
}): ReactNode {
  const Texto = p.titulo ? 'h1' : 'p';
  return (
    <div className={a.stage}>
      {p.mensaje === null ? null : (
        <Texto className={a.bubble}>
          {p.mensaje}
          <span className={a.tail} aria-hidden="true" />
        </Texto>
      )}
      <span className={a.don}>
        <Don pose={p.pose} size={300} />
      </span>
    </div>
  );
}

/**
 * The door's frame (OpAcceso, OpVincular): Don Cuentas helping on the yellow
 * half, the step on the white half. The step is `children`.
 */
export function Marco(p: MarcoProps) {
  return (
    <main className={a.page}>
      <section className={a.aside} aria-label="Bienvenida">
        <div className={a.brandRow}>
          <Coin size={58} />
          <span className={a.wordmark}>XANGARRO!</span>
        </div>
        {p.pose === null ? (
          <div className={a.stage} />
        ) : (
          <Burbuja pose={p.pose} mensaje={p.mensaje} titulo={p.mensajeTitulo ?? false} />
        )}
        <div className={a.chip}>
          <span className={a.chipIcon}>
            <Icon path={p.vinculada ? CAJA : PANTALLA} size={18} />
          </span>
          <span>
            {p.chip} <span className={a.chipSub}>· {p.chipSub}</span>
          </span>
        </div>
      </section>
      <div className={a.main}>
        <div className={a.column} data-testid="acceso-card">
          {p.children}
        </div>
      </div>
    </main>
  );
}
