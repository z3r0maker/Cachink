'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { ColaProvider, useCola } from './cola';
import { OperadorHeader, HEADER_ACTION_ID } from './header';
import { OperadorSidebar } from './sidebar';
import { OperadorTabbar } from './tabbar';
import * as s from './shell.css';
import type { Connection, OperadorShellData } from './types';

/**
 * Development-only: `?connection=sin-conexion` forces the offline header, the
 * way the design's control panel does (ADR-058 §9). Read in an effect rather
 * than with `useSearchParams`, which would need a Suspense boundary around the
 * shell — and a boundary there streams the response before a page can answer
 * 404. Compiled out of production.
 */
function useForcedConnection(fallback: Connection): Connection {
  const [forced, setForced] = useState<Connection | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const q = new URLSearchParams(window.location.search).get('connection');
    setForced(q === 'sin-conexion' ? 'sin-conexion' : null);
  }, []);
  return forced ?? fallback;
}

export function OperadorShell({
  data,
  children,
}: {
  readonly data: OperadorShellData;
  readonly children: ReactNode;
}) {
  return (
    <ColaProvider connection={useForcedConnection(data.connection)} pendientes={data.pendientes}>
      <Frame data={data}>{children}</Frame>
    </ColaProvider>
  );
}

function Frame({
  data,
  children,
}: {
  readonly data: OperadorShellData;
  readonly children: ReactNode;
}) {
  const cola = useCola();
  const shown = { ...data, connection: cola.connection, pendientes: cola.pendientes };
  return (
    <div className={s.frame}>
      <OperadorSidebar data={shown} />
      <div className={s.column}>
        <OperadorHeader data={shown} />
        {children}
        <OperadorTabbar />
      </div>
    </div>
  );
}

/** A screen's yellow header action, rendered into the shell's header slot. */
export function HeaderAction({ children }: { readonly children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => setSlot(document.getElementById(HEADER_ACTION_ID)), []);
  return slot ? createPortal(children, slot) : null;
}
