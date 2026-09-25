'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { srOnly } from '../styles/global.css';
import * as s from './drawer.css';

export interface DrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly heading: string;
  /** Small caps over the heading: what the record is («VENTA · FOLIO V-142»). */
  readonly eyebrow?: string;
  /** A pill beside the eyebrow: «Sincronizada», «Activo». */
  readonly status?: ReactNode;
  /** One line under the heading: when, how, where. */
  readonly subtitle?: string;
  /** Tints the header by record type, e.g. a turno's colour. */
  readonly headerTone?: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  /** 460 px by default (Movimientos); the bell panel is 400, Cortes de turno 560. */
  readonly width?: 400 | 460 | 560;
}

/** Lucide `x`, drawn here: the components layer does not reach into the shell. */
function CloseGlyph() {
  return (
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function Header(props: DrawerProps) {
  return (
    <div
      className={s.header}
      style={props.headerTone ? { background: props.headerTone } : undefined}
    >
      <div className={s.headerTop}>
        {props.eyebrow ? <span className={s.eyebrow}>{props.eyebrow}</span> : null}
        {props.status}
        <Dialog.Close className={s.closeButton} aria-label="Cerrar">
          <CloseGlyph />
        </Dialog.Close>
      </div>
      <Dialog.Title className={s.title}>{props.heading}</Dialog.Title>
      {props.subtitle ? <p className={s.subtitle}>{props.subtitle}</p> : null}
    </div>
  );
}

/**
 * Right-hand detail drawer (ADR-107): what the record is, its title and one
 * line of context on top; the details scroll; the actions stay at the bottom.
 *
 * Radix Dialog gives the focus trap, the Escape handler and the backdrop
 * dismissal the handoff requires. Do not re-implement those.
 */
export function Drawer(props: DrawerProps) {
  const { open, onOpenChange, description, children, actions, width } = props;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content
          className={s.panel}
          style={width ? { width: `min(${width}px, 100vw)` } : undefined}
          aria-describedby={description ? undefined : ''}
        >
          <Header {...props} />
          {description ? (
            <Dialog.Description className={srOnly}>{description}</Dialog.Description>
          ) : null}
          <div className={s.body}>{children}</div>
          {actions ? <div className={s.footer}>{actions}</div> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The status pill a drawer puts beside its eyebrow. */
export function DrawerStatus({
  tone = 'ok',
  children,
}: {
  readonly tone?: 'ok' | 'neutral' | 'warn';
  readonly children: ReactNode;
}) {
  return (
    <span className={s.status[tone]}>
      <span className={s.statusDot[tone]} aria-hidden="true" />
      {children}
    </span>
  );
}
