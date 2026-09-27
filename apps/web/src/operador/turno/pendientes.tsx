'use client';

import Link from 'next/link';
import { colors } from '@xangarro/tokens';
import { formatMoney } from '@xangarro/domain';

import { HOY, ICONS, sumarDias, textoVence } from '@xangarro/caja';
import { hrefRecurrente } from '@xangarro/caja/inicio';
import { useHoyNo } from '../ui/hoy-no';
import { Chip, Panel, Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import * as r from './rows.css';
import type { PendienteRecurrente } from '@xangarro/caja/turno';

/** «Vence hoy» and late in red, the rest in amber; the due ones get the yellow button. */
function dueChip(vence: number): { label: string; bg: string; color: string } {
  if (vence === 0) return { label: 'Vence hoy', bg: colors.redSoft, color: colors.redText };
  if (vence > 0) {
    const label = textoVence(HOY, sumarDias(HOY, vence));
    return { label, bg: colors.warningSoft, color: colors.warningText };
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
 * «Registrar» opens Gastos' drawer filled from the template; saving it
 * advances the schedule, so the row leaves this list and Inicio's «Para hoy».
 * «Hoy no» hides one for the rest of the day on this register (`ui/hoy-no`).
 */
export function PendientesRecurrentes({
  items,
}: {
  readonly items: readonly PendienteRecurrente[];
}) {
  const hoyNo = useHoyNo();
  const shown = items.filter((x) => !hoyNo.ocultos.includes(x.id));
  if (items.length === 0) return null;
  const verTodos =
    shown.length < items.length ? (
      <button type="button" className={r.verTodos} onClick={hoyNo.mostrarTodo}>
        Ver todos
      </button>
    ) : null;
  return (
    <Panel
      label="Pendientes de registrar"
      count={shown.length}
      note="Gastos que se repiten y ya tocan"
      action={verTodos}
    >
      {shown.map((x) => (
        <Row key={x.id} p={x} onSkip={() => hoyNo.ocultar(x.id)} />
      ))}
      {shown.length === 0 ? <div className={r.nada}>No hay gastos por registrar hoy.</div> : null}
    </Panel>
  );
}

function Row({ p: x, onSkip }: { readonly p: PendienteRecurrente; readonly onSkip: () => void }) {
  const chip = dueChip(x.vence);
  return (
    <div className={r.row}>
      <Tile icon={ICONS.gastos} tint={colors.redSoft} />
      <span className={r.main}>
        <span className={r.nameLine}>
          <span className={p.rowTitle}>{x.nombre}</span>
          <Chip label={chip.label} color={chip.color} bg={chip.bg} />
        </span>
        <span className={p.rowDetail}>{x.detalle}</span>
      </span>
      <span className={r.monto}>{formatMoney(x.monto)}</span>
      <span className={r.actions}>
        <Link
          href={hrefRecurrente(x.id)}
          className={x.vence <= 0 ? `${p.outlineBtn} ${p.outlineYellow}` : p.outlineBtn}
        >
          Registrar
        </Link>
        <button
          type="button"
          className={p.quietBtn}
          aria-label={`Hoy no: ${x.nombre}`}
          onClick={onSkip}
        >
          Hoy no
        </button>
      </span>
    </div>
  );
}
