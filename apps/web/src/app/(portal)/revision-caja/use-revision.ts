'use client';

import { useCallback, useState } from 'react';
import { colors } from '@xangarro/tokens';

import { avisoFusion, avisoRechazo } from './derive';
import type { ClienteCaja, Pestana, ProductoCaja, RevisionData } from './types';

export interface Aviso {
  readonly tint: string;
  readonly title: string;
  readonly body: string;
}

/**
 * The inbox: what is still pending, the open review and the last toast. Every
 * exit resolves the record here until the review use case is wired (C-18).
 */
export function useRevision(data: RevisionData, tabInicial: Pestana) {
  const [tab, setTab] = useState<Pestana>(tabInicial);
  const [resueltos, setResueltos] = useState<readonly string[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const productos = data.productos.filter((p) => !resueltos.includes(p.id));
  const clientes = data.clientes.filter((c) => !resueltos.includes(c.id));
  const resolver = (id: string, a: Aviso) => {
    setResueltos((r) => [...r, id]);
    setSel(null);
    setAviso(a);
  };
  const rechazar = (x: ProductoCaja | ClienteCaja) =>
    resolver(x.id, avisoRechazo(tab === 'productos', x.nombre));
  const fusionar = (x: ProductoCaja | ClienteCaja) =>
    resolver(x.id, avisoFusion(x.nombre, x.pareceA ?? ''));
  const cambiarTab = (t: Pestana) => {
    setTab(t);
    setSel(null);
  };
  const cerrarAviso = useCallback(() => setAviso(null), []);
  return {
    tab,
    cambiarTab,
    productos,
    clientes,
    sel,
    setSel,
    aviso,
    cerrarAviso,
    rechazar,
    fusionar,
    aprobar: (id: string, body: string, title: string) =>
      resolver(id, { tint: colors.greenSoft, title, body }),
  };
}

export type Revision = ReturnType<typeof useRevision>;
