'use client';

import { Card, StatusPill, Tag } from '@/components';
import { useSession } from '@/session/provider';
import type { EquipoData } from '@/server/screens';
import { canWrite } from '@/session/gating';

import { RevokeButton } from './revoke-button';
import { avatar, cardFoot, cardGrid, cardHead, cardName } from './equipo.css';

const initials = (n: string) =>
  n
    .split(' ')
    .slice(0, 2)
    .map((w) => w.slice(0, 1))
    .join('');

/** Permissions are stored as JSON; a malformed value must not crash a card. */
function canCancel(permissions: unknown): boolean {
  try {
    const p = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
    return Boolean((p as { canCancelSales?: boolean } | null)?.canCancelSales);
  } catch {
    return false;
  }
}

export function Operadores({ rows }: { readonly rows: EquipoData['operadores'] }) {
  const session = useSession();
  const showPerms = session.capabilities.permisosPorUsuario && canWrite(session.role);
  return (
    <div className={cardGrid}>
      {rows.map((o) => (
        <Card key={o.id}>
          <div className={cardHead}>
            <span className={avatar} aria-hidden="true">
              {initials(o.nombre ?? '')}
            </span>
            <strong className={cardName}>{o.nombre}</strong>
          </div>
          {showPerms && canCancel(o.permissions) ? (
            <div style={{ marginTop: 14 }}>
              <Tag tone="success">Puede cancelar ventas</Tag>
            </div>
          ) : null}
          <p className={cardFoot}>Entra con su nombre y su PIN. No necesita correo.</p>
        </Card>
      ))}
    </div>
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
        <Card key={d.id}>
          <div className={cardHead}>
            <strong className={cardName}>{d.nombre}</strong>
            {d.revokedAt === null ? (
              <StatusPill tone="success">Al día</StatusPill>
            ) : (
              <StatusPill tone="neutral">Revocado</StatusPill>
            )}
          </div>
          {/* A text platform label — never an Apple or Android logo. */}
          <p className={cardFoot}>
            {d.plataforma === 'ios' ? 'iOS' : 'Android'} · {d.modelo}
          </p>
          <p className={cardFoot}>Última sincronización: {d.lastPushAt ?? '—'}</p>
          {mayWrite && d.revokedAt === null ? (
            <RevokeButton deviceId={d.id} nombre={d.nombre} />
          ) : null}
        </Card>
      ))}
    </div>
  );
}
