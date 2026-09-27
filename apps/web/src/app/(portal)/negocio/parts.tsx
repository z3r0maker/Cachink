'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components';
import { Icon } from '@/shell/icon';

import * as n from './negocio.css';

/** The glyphs CfgNegocio draws: storefront, receipt, tag, refresh, pencil, chevron. */
export const ICONO = {
  tienda: 'M4 9h16v11H4V9Zm0 0 2-5h12l2 5M9 20v-6h6v6',
  recibo: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6',
  etiqueta:
    'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM7.5 7.5h.01',
  repetir:
    'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5',
  lapiz:
    'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z',
  flecha: 'm9 18 6-6-6-6',
} as const;

/** A coloured square with one stroked glyph: every panel's and card's marker. */
export function Tile({ path, fondo }: { readonly path: string; readonly fondo: string }) {
  return (
    <span className={n.tile} style={{ background: fondo }} aria-hidden="true">
      <Icon path={path} size={19} strokeWidth={2.3} />
    </span>
  );
}

/** A quiet panel with its tile, title and, for the owner, one edit button. */
export function Panel(props: {
  readonly id: string;
  readonly titulo: string;
  readonly icono: string;
  readonly fondo: string;
  readonly accion?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <section className={n.panel} aria-labelledby={props.id}>
      <div className={n.panelHead}>
        <Tile path={props.icono} fondo={props.fondo} />
        <h2 id={props.id} className={n.panelTitle}>
          {props.titulo}
        </h2>
        {props.accion ? <span className={n.panelAccion}>{props.accion}</span> : null}
      </div>
      {props.children}
    </section>
  );
}

/** «Editar» with the pencil; `label` names the section for screen readers and tests. */
export function EditarBoton(props: {
  readonly texto: string;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      icon={<Icon path={ICONO.lapiz} size={16} strokeWidth={2.3} />}
      aria-label={props.label}
      onClick={props.onClick}
    >
      {props.texto}
    </Button>
  );
}

/** One label and its value; `null` reads «Falta» in amber. */
export function Fila(props: {
  readonly label: string;
  readonly value: string | null;
  readonly extra?: ReactNode;
}) {
  return (
    <div className={n.fila}>
      <span className={n.filaLabel}>{props.label}</span>
      {props.value === null ? (
        <span className={n.falta}>
          <span className={n.faltaPunto} aria-hidden="true" />
          Falta
        </span>
      ) : (
        <span className={n.filaValor}>
          {props.value}
          {props.extra}
        </span>
      )}
    </div>
  );
}
