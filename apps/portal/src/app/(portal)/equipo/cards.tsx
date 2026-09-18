'use client';

import { useState } from 'react';

import { Card, StatusPill, Tag } from '@/components';
import { useSession } from '@/session/provider';
import type { EquipoData } from '@/server/screens';
import { canWrite } from '@/session/gating';

import { OperadorActions } from './operador-actions';
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

type Operador = EquipoData['operadores'][number];

function OperadorCard(props: {
  readonly o: Operador;
  readonly mayWrite: boolean;
  readonly showPerms: boolean;
  readonly onWarning: (w: string | null) => void;
}) {
  const { o, showPerms } = props;
  return (
    <Card>
      <div className={cardHead}>
        <span className={avatar} aria-hidden="true">
          {initials(o.nombre ?? '')}
        </span>
        <strong className={cardName}>{o.nombre}</strong>
        {o.active ? null : <StatusPill tone="neutral">Inactivo</StatusPill>}
      </div>
      {showPerms && canCancel(o.permissions) ? (
        <div style={{ marginTop: 14 }}>
          <Tag tone="success">Puede cancelar ventas</Tag>
        </div>
      ) : null}
      <p className={cardFoot}>
        {o.active
          ? 'Entra con su nombre y su NIP. No necesita correo.'
          : 'Desactivado: no puede entrar a los teléfonos.'}
      </p>
      {props.mayWrite && o.active ? (
        <OperadorActions
          id={o.id}
          nombre={o.nombre ?? ''}
          onWarning={props.onWarning}
          permisos={showPerms ? { canCancelSales: canCancel(o.permissions) } : null}
        />
      ) : null}
    </Card>
  );
}

export function Operadores({ rows }: { readonly rows: EquipoData['operadores'] }) {
  const session = useSession();
  const mayWrite = canWrite(session.role);
  const showPerms = session.capabilities.permisosPorUsuario && mayWrite;
  const [warning, setWarning] = useState<string | null>(null);
  return (
    <>
      {warning === null ? null : (
        <p role="status" data-testid="operador-warning">
          {warning}
        </p>
      )}
      <div className={cardGrid}>
        {rows.map((o) => (
          <OperadorCard
            key={o.id}
            o={o}
            mayWrite={mayWrite}
            showPerms={showPerms}
            onWarning={setWarning}
          />
        ))}
      </div>
    </>
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
