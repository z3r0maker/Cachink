'use client';

import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import * as b from './boton.css';

const FLECHA = 'M5 12h14m-7-7 7 7-7 7';
/** A three-quarter ring: busy (EsCajaPestana, EsCajaDescarga). */
const ARO = 'M21 12a9 9 0 1 1-6.219-8.56';

/** The gate's confirm: yellow only when the step is complete, with the arrow; a turning ring while busy. */
export function Continuar(p: {
  readonly listo: boolean;
  readonly ocupado?: boolean;
  readonly testId: string;
  readonly onClick: () => void;
  readonly describedBy?: string;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  const ocupado = p.ocupado ?? false;
  return (
    <button
      type="button"
      className={p.className ? `${b.primario} ${p.className}` : b.primario}
      disabled={!p.listo || ocupado}
      aria-describedby={p.describedBy}
      aria-busy={ocupado || undefined}
      data-testid={p.testId}
      onClick={p.onClick}
    >
      {ocupado ? (
        <span className={b.gira} aria-hidden="true">
          <Icon path={ARO} size={20} strokeWidth={2.4} />
        </span>
      ) : null}
      {p.children}
      {ocupado ? null : <Icon path={FLECHA} size={20} strokeWidth={2.4} />}
    </button>
  );
}
