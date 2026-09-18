'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';

import { colors } from '@xangarro/tokens';

import { Button } from './button';
import { overlay } from './drawer.css';
import { Seal, type SealLevel } from './seal';
import { Tag } from './tag';
import { confettiPiece, streakRow, takeover, takeoverBody, takeoverTitle } from './celebration.css';

const CONFETTI_FILLS = [colors.white, colors.greenSoft, colors.blueSoft, colors.redSoft] as const;

export interface CelebrationProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly body: string;
  readonly level?: SealLevel;
  /** Consecutive months with the goal met. Not days with a record — see below. */
  readonly streak?: number;
}

/**
 * The goal-achieved takeover.
 *
 * Shown **once per achievement**, never to `viewer`, and skippable by click,
 * Escape or button — the Fase 8 compuerta. It auto-closes after 6 s.
 *
 * **On the streak metric.** It counts *goals met per month*, deliberately not
 * *days with a record*. A streak on "days you recorded something" rewards
 * recording something, which corrupts the data the product exists to keep true;
 * a streak on goals met cannot be farmed, because the goal is measured from
 * ventas that already happened (ADR-058 §6).
 */
function Confetti() {
  return (
    <>
      {CONFETTI_FILLS.flatMap((fill, f) =>
        Array.from({ length: 3 }, (_, i) => {
          const n = f * 3 + i;
          return (
            <span
              key={`c-${n}`}
              className={confettiPiece}
              style={{ left: `${6 + n * 8}%`, background: fill, animationDelay: `${n * 90}ms` }}
              aria-hidden="true"
            />
          );
        }),
      )}
    </>
  );
}

export function Celebration({ open, onClose, title, body, level, streak }: CelebrationProps) {
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content className={takeover} data-onyellow="1">
          <Confetti />
          <Seal level={level} label={title} />
          <Dialog.Title className={takeoverTitle}>{title}</Dialog.Title>
          <Dialog.Description className={takeoverBody}>{body}</Dialog.Description>
          {streak !== undefined && streak > 1 ? (
            <div className={streakRow}>
              <Tag tone="soft">{streak} meses seguidos</Tag>
            </div>
          ) : null}
          <div style={{ marginTop: 22 }}>
            <Dialog.Close asChild>
              <Button variant="dark">Seguir</Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
