'use client';

import type { Canal, FilaPreferencia } from '@xangarro/domain';
import { useState, useTransition } from 'react';

import { Card, Switch, Tag } from '@/components';
import { cambiarCanalAviso } from '@/server/actions/avisos-preferencias';
import { eyebrow } from '@/styles/text.css';

import { cell, channelHead, channelRow, colLabel, noticeWhen } from './avisos.css';

/**
 * «Configurar» (P-32): the member's own delivery matrix, saved on each switch.
 * WhatsApp is designed but not delivered, so it sits in «Próximamente»
 * (design plan §7). **A critical aviso cannot be switched off** — its row shows
 * a locked tag, not a switch that refuses to move.
 */
function CanalCell(props: {
  readonly f: FilaPreferencia;
  readonly canal: Canal;
  readonly pending: boolean;
  readonly onToggle: (f: FilaPreferencia, canal: Canal, on: boolean) => void;
}) {
  const { f, canal } = props;
  // As designed: the portal column says why it is locked, the email column
  // just says it is on.
  if (f.critico) {
    return canal === 'portal' ? <Tag tone="danger">Obligatorio</Tag> : <Tag tone="success">Sí</Tag>;
  }
  return (
    <Switch
      checked={f[canal]}
      disabled={props.pending}
      label={`${f.label} ${canal === 'portal' ? 'en el portal' : 'por correo'}`}
      onCheckedChange={(on) => props.onToggle(f, canal, on)}
    />
  );
}

function Fila(props: {
  readonly f: FilaPreferencia;
  readonly pending: boolean;
  readonly onToggle: (f: FilaPreferencia, canal: Canal, on: boolean) => void;
}) {
  const { f } = props;
  return (
    <div className={channelRow}>
      <span>
        <span style={{ fontWeight: 800, display: 'block' }}>{f.label}</span>
        {f.critico ? <span className={noticeWhen}>Siempre activo</span> : null}
      </span>
      {(['portal', 'correo'] as const).map((canal) => (
        <span key={canal} className={cell}>
          <CanalCell f={f} canal={canal} pending={props.pending} onToggle={props.onToggle} />
        </span>
      ))}
      <span className={cell}>
        <Tag tone="soft">Próximamente</Tag>
      </span>
    </div>
  );
}

export function ConfigurarCard({ inicial }: { readonly inicial: readonly FilaPreferencia[] }) {
  const [filas, setFilas] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const onToggle = (f: FilaPreferencia, canal: Canal, on: boolean) =>
    startTransition(async () => {
      const r = await cambiarCanalAviso(f.tipo, canal, on);
      if (!r.ok) return setError(r.message);
      setError(null);
      setFilas(r.filas);
    });
  return (
    <Card>
      <div className={eyebrow} style={{ marginBottom: 14 }}>
        Cómo quieres enterarte
      </div>
      <div className={channelHead}>
        <span className={eyebrow}>Aviso</span>
        <span className={colLabel}>En el portal</span>
        <span className={colLabel}>Por correo</span>
        <span className={colLabel}>Por WhatsApp</span>
      </div>
      {filas.map((f) => (
        <Fila key={f.tipo} f={f} pending={pending} onToggle={onToggle} />
      ))}
      {error === null ? null : <p role="alert">{error}</p>}
    </Card>
  );
}
