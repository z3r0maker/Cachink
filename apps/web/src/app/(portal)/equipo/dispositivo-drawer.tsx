'use client';

import { formatFechaHora, formatMoney } from '@xangarro/domain';
import { useState, useTransition } from 'react';

import { Button, Drawer } from '@/components';
import { cortesDelDispositivo, type CortesResult } from '@/server/actions/dispositivos';
import type { EquipoData } from '@/server/screens';

import { RevokeButton } from './revoke-button';

/**
 * The device drawer (P-06): its fields, its last five cortes, and
 * «Desvincular» for admins. Cortes load when it opens. Platform is a text
 * label — never an Apple or Android logo (design handoff).
 */
type Dispositivo = EquipoData['dispositivos'][number];

const signo = (d: bigint) =>
  d > 0n ? `+${formatMoney(d)}` : d < 0n ? `−${formatMoney(-d)}` : 'Cuadró';

function Cortes({ r }: { readonly r: CortesResult | null }) {
  if (r === null) return <p>Cargando cortes…</p>;
  if (!r.ok) return <p role="alert">{r.message}</p>;
  if (r.cortes.length === 0) return <p>Este dispositivo aún no tiene cortes.</p>;
  return (
    <ul aria-label="Cortes recientes" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {r.cortes.map((c) => (
        <li key={c.id} style={{ padding: '8px 0' }}>
          <strong>{c.fecha}</strong> · esperado {formatMoney(c.esperado)}, contado{' '}
          {formatMoney(c.contado)} · {signo(c.diferencia)}
        </li>
      ))}
    </ul>
  );
}

export function DispositivoDetalle(props: { readonly d: Dispositivo; readonly mayWrite: boolean }) {
  const { d } = props;
  const [open, setOpen] = useState(false);
  const [r, setR] = useState<CortesResult | null>(null);
  const [, startTransition] = useTransition();
  const abrir = () => {
    setOpen(true);
    startTransition(async () => setR(await cortesDelDispositivo(d.id)));
  };
  return (
    <>
      <Button size="sm" variant="ghost" onClick={abrir} aria-label={`Ver detalle de ${d.nombre}`}>
        Ver detalle
      </Button>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        heading={d.nombre}
        description="El dispositivo, su última sincronización y sus cortes recientes."
        actions={
          props.mayWrite && d.revokedAt === null ? (
            <RevokeButton deviceId={d.id} nombre={d.nombre} label="Desvincular" />
          ) : null
        }
      >
        <p>
          {d.plataforma === 'ios' ? 'iOS' : 'Android'} · {d.modelo}
        </p>
        <p>Última sincronización: {formatFechaHora(d.lastPushAt)}</p>
        <p>{d.revokedAt === null ? 'Vinculado' : `Revocado el ${formatFechaHora(d.revokedAt)}`}</p>
        <h3>Cortes recientes</h3>
        <Cortes r={r} />
      </Drawer>
    </>
  );
}
