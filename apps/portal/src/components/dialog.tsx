'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { Button } from './button';
import { overlay } from './drawer.css';
import { dialogActions, dialogBody, dialogPanel, dialogTitle } from './dialog.css';

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly body: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  /** A destructive confirm renders its action in the danger fill. */
  readonly destructive?: boolean;
  readonly onConfirm: () => void;
  readonly children?: ReactNode;
}

/**
 * Confirm dialog.
 *
 * Copy carries the consequence, not just the question — "Revocar borra el
 * acceso, no los datos ya sincronizados." Radix supplies the focus trap and
 * Escape.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlay} />
        <RadixDialog.Content className={dialogPanel}>
          <RadixDialog.Title className={dialogTitle}>{title}</RadixDialog.Title>
          <RadixDialog.Description className={dialogBody}>{body}</RadixDialog.Description>
          {children}
          <div className={dialogActions}>
            <RadixDialog.Close asChild>
              <Button variant="ghost">{cancelLabel}</Button>
            </RadixDialog.Close>
            <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
