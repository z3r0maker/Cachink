'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import * as d from './dialogo-mostrador.css';

const X = 'M18 6 6 18M6 6l12 12';

/**
 * The centred dialog of the El Mostrador boards (OpCancelarVenta, OpComprobante,
 * OpProductoNuevo): Radix for the focus trap, Esc and the scrim click; the card
 * draws the board's white body, 2.5 px black edge and hard shadow. The caller
 * renders its own head with a `DialogoTitulo`.
 */
export function DialogoMostrador(p: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly width: number;
  /** An alert dialog (a destructive confirmation). */
  readonly alerta?: boolean;
  /** Leave room above the card for Don Cuentas peeking over it. */
  readonly conDon?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Dialog.Root open={p.open} onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={d.overlay}>
          <Dialog.Content
            className={d.card}
            role={p.alerta ? 'alertdialog' : 'dialog'}
            style={{ maxWidth: p.width }}
            data-don={p.conDon ? '' : undefined}
            aria-describedby={undefined}
          >
            {p.children}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const DialogoTitulo = Dialog.Title;

/** The head's close square, lucide `x`. */
export function DialogoCerrar(p: { readonly label: string; readonly fuerte?: boolean }) {
  return (
    <Dialog.Close className={d.cerrar} aria-label={p.label} data-fuerte={p.fuerte ? '' : undefined}>
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={X} />
      </svg>
    </Dialog.Close>
  );
}
