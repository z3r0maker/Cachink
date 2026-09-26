'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Button } from './button';
import * as d from './dialog.css';
import { Don, type DonPose } from './don/don';
import { overlay } from './drawer.css';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  /** A destructive confirm renders its action in the danger fill. */
  readonly destructive?: boolean;
  /** Disables the confirm action — an in-flight save must ignore a smash. */
  readonly confirmDisabled?: boolean;
  readonly onConfirm: () => void;
  /**
   * Don Cuentas peeking over the card (ADR-107): worried before something
   * destructive, thinking otherwise. `false` leaves him out.
   */
  readonly don?: DonPose | false;
  readonly children?: ReactNode;
}

/**
 * Confirm dialog.
 *
 * Copy carries the consequence, not just the question — "Revocar borra el
 * acceso, no los datos ya sincronizados." Radix supplies the focus trap and
 * Escape.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, onOpenChange, title, body, confirmLabel, destructive, children } = props;
  const pose = props.don ?? (destructive ? 'preocupado' : 'pensando');
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content className={d.dialogPanel[pose === false ? 'plain' : 'conDon']}>
          {pose === false ? null : (
            <div className={d.dialogDon} aria-hidden="true">
              <Don pose={pose} size={136} />
            </div>
          )}
          <div className={d.dialogScroll}>
            <RadixDialog.Title className={d.dialogTitle}>{title}</RadixDialog.Title>
            <RadixDialog.Description className={d.dialogBody}>{body}</RadixDialog.Description>
            {children}
          </div>
          <div className={d.dialogActions}>
            <RadixDialog.Close asChild>
              <Button variant="secondary">{props.cancelLabel ?? 'Cancelar'}</Button>
            </RadixDialog.Close>
            <Button
              variant={destructive ? 'danger' : 'primary'}
              onClick={props.onConfirm}
              disabled={props.confirmDisabled}
            >
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
