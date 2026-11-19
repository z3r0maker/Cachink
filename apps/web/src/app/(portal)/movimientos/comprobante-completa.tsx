'use client';

import * as RadixDialog from '@radix-ui/react-dialog';

import { Button } from '@/components';
import { overlayDialogo } from '@/components/drawer.css';

import * as s from './comprobante.css';

/**
 * The receipt full size (board CgPortal, «Foto completa»): over the drawer,
 * on black, what it is on top and «Cerrar» beside it. A Radix dialog nested
 * in the drawer's, so Escape and the focus trap close this one first.
 */
export function ComprobanteCompleto(props: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly src: string;
  readonly alt: string;
  /** «Tortillas · −$180.00». */
  readonly titulo: string;
}) {
  return (
    <RadixDialog.Root open={props.open} onOpenChange={props.onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayDialogo} />
        <RadixDialog.Content
          className={s.completa}
          aria-describedby={undefined}
          data-testid="comprobante-completo"
        >
          <div className={s.completaBarra}>
            <div className={s.completaTitulos}>
              <span className={s.completaEtiqueta}>COMPROBANTE</span>
              <RadixDialog.Title className={s.completaTitulo}>{props.titulo}</RadixDialog.Title>
            </div>
            <RadixDialog.Close asChild>
              <Button variant="secondary">Cerrar</Button>
            </RadixDialog.Close>
          </div>
          {/* A same-origin, session-scoped route: a plain <img>, as product photos. */}
          <img className={s.completaFoto} src={props.src} alt={props.alt} />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
