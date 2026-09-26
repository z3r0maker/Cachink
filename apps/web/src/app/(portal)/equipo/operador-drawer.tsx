'use client';

import { formatFechaHora, formatMoney } from '@xangarro/domain';
import { useState, useTransition } from 'react';

import { Button, Drawer } from '@/components';
import { seccionDrawer } from '@/styles/text.css';
import { turnosDelOperador, type TurnosResult } from '@/server/actions/equipo-detalle';

/**
 * The operator drawer (P-05): their last five shifts — when each opened and
 * closed, and how the count came out. An open shift says so. Loaded on open.
 */
const resultado = (d: bigint | null) =>
  d === null
    ? 'sin contar'
    : d === 0n
      ? 'cuadró'
      : d > 0n
        ? `sobró ${formatMoney(d)}`
        : `faltó ${formatMoney(-d)}`;

function Turnos({ r }: { readonly r: TurnosResult | null }) {
  if (r === null) return <p>Cargando turnos…</p>;
  if (!r.ok) return <p role="alert">{r.message}</p>;
  if (r.rows.length === 0) return <p>Aún no ha abierto ningún turno.</p>;
  return (
    <ul aria-label="Turnos recientes" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {r.rows.map((t) => (
        <li key={t.id} style={{ padding: '8px 0' }}>
          <strong>{formatFechaHora(t.aperturaAt)}</strong> ·{' '}
          {t.cierreAt === null
            ? 'Turno abierto'
            : `cerró ${formatFechaHora(t.cierreAt)}, ${resultado(t.diferencia)}`}
        </li>
      ))}
    </ul>
  );
}

export function OperadorDetalle({ id, nombre }: { readonly id: string; readonly nombre: string }) {
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<TurnosResult | null>(null);
  const [, startTransition] = useTransition();
  const abrir = () => {
    setOpen(true);
    startTransition(async () => setR(await turnosDelOperador(id)));
  };
  return (
    <>
      <Button size="sm" variant="ghost" onClick={abrir} aria-label={`Ver detalle de ${nombre}`}>
        Ver detalle
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        eyebrow="Persona que cobra"
        heading={nombre}
        description="Sus turnos recientes en la caja."
      >
        <p>Entra con su nombre y su NIP. No necesita correo.</p>
        <h3 className={seccionDrawer}>Turnos recientes</h3>
        <Turnos r={r} />
      </Drawer>
    </>
  );
}
