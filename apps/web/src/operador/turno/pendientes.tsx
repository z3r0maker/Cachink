'use client';

import { useState } from 'react';
import Link from 'next/link';
import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { OPERADOR_BASE } from '../shell/nav';
import * as u from '../ui/ui.css';
import * as l from './lists.css';
import type { PendienteRecurrente } from './types';

const CLOCK = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2';

/** «Vence hoy» / «Vence mañana» / «Atrasado 1 día», with the design's tints. */
function dueChip(vence: number): { label: string; bg: string; color: string } {
  if (vence === 0) return { label: 'Vence hoy', bg: colors.warningSoft, color: colors.warningText };
  if (vence > 0) {
    const label = vence === 1 ? 'Vence mañana' : `Vence en ${vence} días`;
    return { label, bg: colors.gray100, color: colors.gray600 };
  }
  const dias = -vence;
  return {
    label: `Atrasado ${dias} ${dias === 1 ? 'día' : 'días'}`,
    bg: colors.redSoft,
    color: colors.redText,
  };
}

/**
 * «Pendientes de registrar»: recurring expenses nobody has captured today.
 * «Hoy no» hides one for the rest of the day on this register (device-local).
 */
export function PendientesRecurrentes({
  items,
}: {
  readonly items: readonly PendienteRecurrente[];
}) {
  const [skipped, setSkipped] = useState<readonly string[]>([]);
  const shown = items.filter((p) => !skipped.includes(p.id));
  if (shown.length === 0) return null;
  return (
    <section className={u.listCard}>
      <div className={u.listHead} style={{ background: colors.warningSoft }}>
        <span className={l.clockTile}>
          <Icon path={CLOCK} size={18} strokeWidth={2.5} />
        </span>
        <span className={l.headTitle}>Pendientes de registrar</span>
        <span className={u.countPill}>{shown.length}</span>
        <span className={u.headNote}>Gastos que se repiten y hoy nadie ha capturado.</span>
      </div>
      {shown.map((p) => (
        <Row key={p.id} p={p} onSkip={() => setSkipped((s) => [...s, p.id])} />
      ))}
    </section>
  );
}

function Row({ p, onSkip }: { readonly p: PendienteRecurrente; readonly onSkip: () => void }) {
  const chip = dueChip(p.vence);
  return (
    <div className={u.row} style={{ gap: 12, padding: '14px 18px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={l.name}>{p.nombre}</div>
        <div className={l.detail}>{p.detalle}</div>
      </div>
      <span className={l.due} style={{ background: chip.bg, color: chip.color }}>
        {chip.label}
      </span>
      <span className={l.amount} style={{ color: colors.black }}>
        {formatMoney(p.monto)}
      </span>
      <div className={l.actions}>
        <Link href={`${OPERADOR_BASE}/gastos`} className={l.registrar} data-onyellow="">
          Registrar
        </Link>
        <button type="button" className={l.hoyNo} onClick={onSkip}>
          Hoy no
        </button>
      </div>
    </div>
  );
}
