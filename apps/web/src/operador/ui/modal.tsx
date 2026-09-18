'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Icon } from '../../shell/icon';
import * as m from './modal.css';

const CLOSE = 'M6 6l12 12M18 6 6 18';

export interface OpModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  /** Title size in px: 16 or 17 in the files. */
  readonly titleSize: number;
  readonly width: number;
  readonly headBg: string;
  /** Extra head content after the title (Cobrar's total), and before it (its back button). */
  readonly before?: ReactNode;
  readonly after?: ReactNode;
  readonly square?: 32 | 34;
  /** Head gap: 10 in most files, 12 in Cobrar. */
  readonly headGap?: 10 | 12;
  /** The body's own layout; `null` lets the caller render its own scrolling body. */
  readonly bodyGap?: number | null;
  readonly children: ReactNode;
}

/** The operator modal on Radix (focus trap, Esc), styled from the design files. */
export function OpModal(p: OpModalProps) {
  const sq = p.square ?? 32;
  return (
    <Dialog.Root open={p.open} onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={m.overlay}>
          <Dialog.Content
            className={m.card}
            style={{ maxWidth: p.width }}
            aria-describedby={undefined}
          >
            <div className={m.head} style={{ background: p.headBg, gap: p.headGap ?? 10 }}>
              {p.before}
              <Dialog.Title className={m.title} style={{ fontSize: p.titleSize }}>
                {p.title}
              </Dialog.Title>
              {p.after}
              <Dialog.Close
                className={m.square}
                style={{ width: sq, height: sq, marginLeft: p.after ? undefined : 'auto' }}
                title="Cerrar"
                data-onyellow=""
              >
                <Icon path={CLOSE} size={16} strokeWidth={2.6} />
              </Dialog.Close>
            </div>
            {p.bodyGap === null ? (
              p.children
            ) : (
              <div className={m.body} style={{ gap: p.bodyGap ?? 14 }}>
                {p.children}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
