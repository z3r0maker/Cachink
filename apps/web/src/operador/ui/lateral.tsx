'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import * as s from './lateral.css';

const CLOSE = 'M18 6 6 18M6 6l12 12';

export interface LateralProps {
  readonly onClose: () => void;
  /** Small caps over the title: what the panel is («MOVIMIENTO DE INVENTARIO»). */
  readonly eyebrow: string;
  readonly title: string;
  /** 26 px by default; `md` is 22 px, for a name beside an avatar. */
  readonly titleSize?: 'md' | 'lg';
  /** Beside the eyebrow: a state chip. */
  readonly chip?: ReactNode;
  /** Before the title, in its row: an avatar. */
  readonly lead?: ReactNode;
  /** Under the title, in its column. */
  readonly sub?: ReactNode;
  /** Under the title row, still in the head: a big figure, a segmented choice. */
  readonly head?: ReactNode;
  readonly footer?: ReactNode;
  /** 480 px (a form) or 500 px (an account); the whole width on a phone. */
  readonly width?: 480 | 500;
  readonly children: ReactNode;
}

/**
 * The operator's right-hand panel (El Mostrador): eyebrow and close on top,
 * the title, the scrolling body and the actions at the foot. Radix Dialog
 * gives the focus trap, Escape and the backdrop close.
 */
export function Lateral(p: LateralProps) {
  return (
    <Dialog.Root open onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content
          className={s.panel}
          style={{ width: `min(${p.width ?? 480}px, 100vw)` }}
          aria-describedby={undefined}
        >
          <Cabeza {...p} />
          <div className={s.body}>{p.children}</div>
          {p.footer ? <div className={s.footer}>{p.footer}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Cabeza(p: LateralProps) {
  return (
    <div className={s.head}>
      <div className={s.headTop}>
        <span className={s.eyebrow}>{p.eyebrow}</span>
        {p.chip}
        <Dialog.Close className={s.close} aria-label="Cerrar">
          <Icon path={CLOSE} size={20} strokeWidth={2.4} />
        </Dialog.Close>
      </div>
      <div className={s.titleRow}>
        {p.lead}
        <div className={s.titleCol}>
          <Dialog.Title className={p.titleSize === 'md' ? s.titleMd : s.title}>
            {p.title}
          </Dialog.Title>
          {p.sub}
        </div>
      </div>
      {p.head}
    </div>
  );
}
