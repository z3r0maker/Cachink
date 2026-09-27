'use client';

import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import * as b from './boton.css';

const FLECHA = 'M5 12h14m-7-7 7 7-7 7';

/** The gate's confirm: yellow only when the step is complete, with the arrow. */
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
      data-testid={p.testId}
      onClick={p.onClick}
    >
      {p.children}
      <Icon path={FLECHA} size={20} strokeWidth={2.4} />
    </button>
  );
}
