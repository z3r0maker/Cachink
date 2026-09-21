'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@xangarro/tokens';

import {
  aprobarCliente,
  aprobarProducto,
  fusionar as fusionarEnServidor,
  rechazar as rechazarEnServidor,
} from '@/server/actions/revision';
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
  const router = useRouter();
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
  const cambiarTab = (t: Pestana) => {
    setTab(t);
    setSel(null);
  };
  const cerrarAviso = useCallback(() => setAviso(null), []);
  const acciones = crearAcciones({
    esProducto: () => tab === 'productos',
    resolver,
    fallo: (m: string) => setAviso({ tint: colors.redSoft, title: 'No se pudo guardar', body: m }),
    refrescar: () => router.refresh(),
  });
  return {
    tab,
    cambiarTab,
    productos,
    clientes,
    sel,
    setSel,
    aviso,
    cerrarAviso,
    rechazar: acciones.rechazar,
    fusionar: acciones.fusionar,
    aprobarProducto: acciones.aprobarProducto,
    aprobarCliente: acciones.aprobarCliente,
  };
}

export type Revision = ReturnType<typeof useRevision>;

/** Run one of the server writes; a failure toasts, a success refreshes. */
function lanzar(
  w: Promise<{ ok: true } | { ok: false; message: string }>,
  p: { readonly fallo: (m: string) => void; readonly refrescar: () => void },
): void {
  void w.then((r) => {
    if (!r.ok) p.fallo(r.message);
    else p.refrescar();
  });
}

/** The two approvals' write half (O-37). */
function crearAprobadores(p: {
  readonly resolver: (id: string, a: { tint: string; title: string; body: string }) => void;
  readonly fallo: (m: string) => void;
  readonly refrescar: () => void;
}) {
  return {
    aprobarProducto(
      x: ProductoCaja,
      f: {
        readonly precioCentavos: bigint;
        readonly costoCentavos: bigint;
        readonly categoria: string;
        readonly existencias: number;
        readonly umbral: number;
      },
      body: string,
    ): void {
      p.resolver(x.id, { tint: colors.greenSoft, title: 'Producto aprobado', body });
      lanzar(aprobarProducto(x.id, f), p);
    },
    aprobarCliente(
      x: ClienteCaja,
      f: { readonly limiteCentavos: bigint; readonly plazoDias: number },
      body: string,
    ): void {
      p.resolver(x.id, { tint: colors.greenSoft, title: 'Cliente aprobado', body });
      lanzar(aprobarCliente(x.id, f.limiteCentavos, f.plazoDias), p);
    },
  };
}

/** The three exits' write half, bound to the page's helpers (O-37). */
function crearAcciones(p: {
  readonly esProducto: () => boolean;
  readonly resolver: (id: string, a: { tint: string; title: string; body: string }) => void;
  readonly fallo: (m: string) => void;
  readonly refrescar: () => void;
}) {
  const tipo = () => (p.esProducto() ? 'producto' : 'cliente');
  return {
    rechazar(x: ProductoCaja | ClienteCaja): void {
      p.resolver(x.id, avisoRechazo(p.esProducto(), x.nombre));
      lanzar(rechazarEnServidor(tipo(), x.id), p);
    },
    fusionar(x: ProductoCaja | ClienteCaja): void {
      if (x.pareceAId === null || x.pareceAId === undefined) return;
      p.resolver(x.id, avisoFusion(x.nombre, x.pareceA ?? ''));
      lanzar(fusionarEnServidor(tipo(), x.id, x.pareceAId), p);
    },
    ...crearAprobadores(p),
  };
}
