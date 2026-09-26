'use client';

import { formatFechaHora } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Banner, Card, StatusPill } from '@/components';
import type { EquipoData } from '@/server/screens';
import { Icon } from '@/shell/icon';

import { DispositivoDetalle } from './dispositivo-drawer';
import { RevokeButton } from './revoke-button';
import { avatar, cardFoot, cardGrid, cardHead, cardName } from './equipo.css';

/**
 * The device cards (C-5): the 44×44 tile, who is on the phone and whether
 * their shift is running, and the strip for rows the server refused. Split
 * out of `cards.tsx` when the operator half filled it.
 */
/** Lucide-idiom phone, the same path the sidebar's Dispositivos item uses. */
const TELEFONO = 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2';

type Dispositivo = EquipoData['dispositivos'][number];

/** The amber strip, when this phone has rows the server refused (C-5). */
function Rechazados({ n }: { readonly n: number }) {
  if (n === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      {/* The design's strip counts rows «esperando conexión» — a queue on the
          phone the server cannot see. What it *can* see is what the phone
          sent and the server refused: the same owner's problem, under a name
          we can stand behind. */}
      <Banner
        tone="warning"
        title={`${n} ${n === 1 ? 'registro rechazado' : 'registros rechazados'}`}
        body="Esta caja mandó movimientos que no pudimos guardar. Revísalos en Sincronización."
      />
    </div>
  );
}

function DispositivoCard({ d, mayWrite }: { readonly d: Dispositivo; readonly mayWrite: boolean }) {
  return (
    <Card>
      <div className={cardHead}>
        {/* The 44×44 tile the design gives every device (C-5). A text
                platform label inside it — never an Apple or Android logo. */}
        <span
          className={avatar}
          style={{ width: 44, height: 44, background: colors.blueSoft }}
          aria-hidden="true"
        >
          <Icon path={TELEFONO} size={20} strokeWidth={2.2} />
        </span>
        <strong className={cardName}>{d.nombre}</strong>
        {d.revokedAt === null ? (
          <StatusPill tone="success">Al día</StatusPill>
        ) : (
          <StatusPill tone="neutral">Revocado</StatusPill>
        )}
      </div>
      <p className={cardFoot}>
        {d.plataforma === 'ios' ? 'iOS' : 'Android'} · {d.modelo}
      </p>
      {/* Who is on it, and whether their shift is still running. */}
      <p className={cardFoot}>
        {d.operador === null ? 'Sin operador todavía' : d.operador} ·{' '}
        {d.turnoAbierto ? 'turno abierto' : 'turno cerrado'}
      </p>
      <p className={cardFoot}>Última sincronización: {formatFechaHora(d.lastPushAt)}</p>
      <Rechazados n={d.rechazados} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {mayWrite && d.revokedAt === null ? (
          <RevokeButton deviceId={d.id} nombre={d.nombre} />
        ) : null}
        <DispositivoDetalle d={d} mayWrite={mayWrite} />
      </div>
    </Card>
  );
}

export function Dispositivos({
  rows,
  mayWrite,
}: {
  readonly rows: EquipoData['dispositivos'];
  /** A viewer sees no Revocar at all — hidden, not disabled. The action refuses regardless. */
  readonly mayWrite: boolean;
}) {
  return (
    <div className={cardGrid}>
      {rows.map((d) => (
        <DispositivoCard key={d.id} d={d} mayWrite={mayWrite} />
      ))}
    </div>
  );
}
