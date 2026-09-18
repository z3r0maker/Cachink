'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { srOnly } from '../styles/global.css';
import { body, closeButton, footer, header, overlay, panel, title } from './drawer.css';

export interface DrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly heading: string;
  /** Tints the 76 px header by record type, e.g. green for a venta. */
  readonly headerTone?: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  /** 460 px by default (Movimientos); Cortes de turno's handoff asks for 560. */
  readonly width?: 460 | 560;
}

/**
 * Right-hand detail drawer.
 *
 * Radix Dialog gives the focus trap, the Escape handler and the backdrop
 * dismissal the handoff requires. Do not re-implement those.
 */
export function Drawer({
  open,
  onOpenChange,
  heading,
  headerTone,
  description,
  children,
  actions,
  width,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={overlay} />
        <Dialog.Content
          className={panel}
          style={width ? { width: `min(${width}px, 100vw)` } : undefined}
          aria-describedby={description ? undefined : ''}
        >
          <div className={header} style={headerTone ? { background: headerTone } : undefined}>
            <Dialog.Title className={title}>{heading}</Dialog.Title>
            <Dialog.Close className={closeButton} aria-label="Cerrar">
              ×
            </Dialog.Close>
          </div>
          {description ? (
            <Dialog.Description className={srOnly}>{description}</Dialog.Description>
          ) : null}
          <div className={body}>{children}</div>
          {actions ? <div className={footer}>{actions}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
