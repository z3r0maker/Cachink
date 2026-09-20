'use client';

import type { ReactNode } from 'react';
import { colors } from '@xangarro/tokens';

import * as a from './acceso.css';

/** The gate's confirm: 56 px, yellow only when the step is complete. */
export function Continuar(p: {
  readonly listo: boolean;
  readonly ocupado?: boolean;
  readonly testId: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  const ocupado = p.ocupado ?? false;
  return (
    <button
      type="button"
      className={a.key}
      style={{ height: 56, background: p.listo ? colors.yellow : colors.gray100 }}
      disabled={!p.listo || ocupado}
      data-testid={p.testId}
      onClick={p.onClick}
    >
      {p.children}
    </button>
  );
}
