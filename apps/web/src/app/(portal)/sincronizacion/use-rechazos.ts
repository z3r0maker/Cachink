'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { marcarRechazoResuelto } from '@/server/actions/rechazos';

import type { Rechazo } from './rechazo-texto';

/**
 * «Ya lo resolví» is saved (`resolved_at`), not just hidden: the action runs,
 * the page refreshes from the server, and the row stays here as a green «Listo»
 * note for this visit so the owner sees what happened. A refused retry from the
 * caja reopens it server-side.
 */
export interface Item {
  readonly r: Rechazo;
  readonly hecho: boolean;
}

const cuando = (r: Rechazo) => String(r.receivedAt ?? '');

export function useRechazos(rows: readonly Rechazo[]) {
  const [hechos, setHechos] = useState<readonly Rechazo[]>([]);
  const router = useRouter();
  const ids = new Set(hechos.map((h) => h.id));
  const abiertos = rows.filter((r) => !ids.has(r.id));
  const items: readonly Item[] = [
    ...abiertos.map((r) => ({ r, hecho: false })),
    ...hechos.map((r) => ({ r, hecho: true })),
  ].sort((a, b) => cuando(b.r).localeCompare(cuando(a.r)));
  const resolver = async (r: Rechazo): Promise<string | null> => {
    const res = await marcarRechazoResuelto(r.id);
    if (!res.ok) return res.message;
    setHechos((h) => [...h, r]);
    router.refresh();
    return null;
  };
  return { abiertos, items, resolver, resueltos: hechos.length };
}
