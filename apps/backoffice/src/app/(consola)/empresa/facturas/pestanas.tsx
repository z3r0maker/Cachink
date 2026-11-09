import type { Route } from 'next';
import Link from 'next/link';

import * as m from '@/styles/mostrador.css';

/**
 * «Emitidas · Recibidas» under Dinero's header (boards CD-06b and CD-06i):
 * two routes, so the month links keep the list they are on.
 */
const PESTANAS = [
  { id: 'emitidas', label: 'Emitidas', ruta: '/empresa/facturas/emitidas' },
  { id: 'recibidas', label: 'Recibidas', ruta: '/empresa/facturas' },
] as const;

export function PestanasFacturas({
  actual,
  mes,
}: {
  readonly actual: (typeof PESTANAS)[number]['id'];
  readonly mes: string;
}) {
  return (
    <nav className={m.row} aria-label="Facturas">
      {PESTANAS.map((p) => (
        <Link
          key={p.id}
          className={m.chip}
          href={`${p.ruta}?mes=${mes}` as Route}
          aria-current={p.id === actual ? 'true' : undefined}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
