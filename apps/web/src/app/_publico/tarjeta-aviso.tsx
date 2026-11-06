import { PROVEEDOR } from '@xangarro/domain';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Card } from '@/components';
import { button } from '@/components/button.css';

import { pila, placaTono } from './publico.css';
import * as s from './tarjeta-aviso.css';

/**
 * The card an emailed link opens (`/cancelar`, `/eliminacion`): a glyph tile,
 * the page's content, and the supplier with its contact under it (LFPC art.
 * 76 Bis I). One frame for every such link.
 */
export function TarjetaAviso(props: { readonly icono: ReactNode; readonly children: ReactNode }) {
  return (
    <div className={s.marco}>
      <Card emphasis="hero">
        <div className={pila}>
          <span className={placaTono.amarilla} aria-hidden="true">
            {props.icono}
          </span>
          {props.children}
          <p className={s.pie}>
            ¿Dudas? Escríbenos a {PROVEEDOR.correo}. {PROVEEDOR.razonSocial}, {PROVEEDOR.domicilio}.
          </p>
        </div>
      </Card>
    </div>
  );
}

/** An action that leaves the card: a full-width secondary button, never a bare link. */
export function IrA({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <Link href={href} className={button({ variant: 'secondary', full: true })}>
      {label}
    </Link>
  );
}
