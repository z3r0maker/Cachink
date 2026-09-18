'use client';

import { Card, PendingButton, StatusPill, Tag } from '@/components';
import { useSession } from '@/session/provider';
import type { EquipoData } from '@/server/screens';
import { canWrite } from '@/session/gating';
import { ACTIVATION_CODE, CODE_EXPIRES_IN } from '@/fixtures/equipo';

import {
  avatar,
  cardFoot,
  cardGrid,
  cardHead,
  cardName,
  codeBox,
  codeRow,
  panelTitle,
} from './equipo.css';

/** The pairing panel. Codes never contain 0, O, 1 or I. */
export function PairingPanel() {
  return (
    <Card tone="hero" emphasis="hero">
      <strong className={panelTitle}>Código de vinculación activo</strong>
      <p style={{ margin: '8px 0 0', fontWeight: 600 }}>
        Escríbelo en el teléfono del operador. Vence en {CODE_EXPIRES_IN}.
      </p>
      <div className={codeRow}>
        {ACTIVATION_CODE.split('').map((c, i) => (
          <span key={`${c}-${i}`} className={codeBox}>
            {c}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <PendingButton reason="Falta el alta de dispositivos (B-11).">Generar otro</PendingButton>
        <PendingButton reason="Falta el envío de correo (B-14).">Enviar por correo</PendingButton>
      </div>
    </Card>
  );
}

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

export function Dispositivos({ rows }: { readonly rows: EquipoData['dispositivos'] }) {
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
        </Card>
      ))}
    </div>
  );
}
