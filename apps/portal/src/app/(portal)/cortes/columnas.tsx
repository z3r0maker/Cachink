import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import type { ColumnDef } from '@/components';
import { DIF } from '@/operador/cierre/copy';

import * as s from './cortes.css';
import { conSigno, contado, diferencia, esperado } from './derive';
import type { Corte, EstadoCorte } from './types';

export const ESTADO: Record<EstadoCorte, { bg: string; color: string }> = {
  Cuadró: { bg: colors.greenSoft, color: colors.greenText },
  'Por aclarar': { bg: colors.warningSoft, color: colors.warningText },
  Aclarado: { bg: colors.blueSoft, color: colors.blueText },
};

function Turno({ c }: { readonly c: Corte }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span className={s.avatar} style={{ background: c.tint }}>
        {c.iniciales}
      </span>
      <div style={{ minWidth: 0 }}>
        <div className={s.nombre}>{c.operador}</div>
        <div
          className={s.linea}
          style={{ color: colors.gray600 }}
        >{`${c.caja} · ${c.dia} · ${c.horario}`}</div>
      </div>
    </div>
  );
}

function Diferencia({ c }: { readonly c: Corte }) {
  const d = diferencia(c);
  return (
    <span className={s.chip} style={{ background: DIF[d.tipo].bg, color: DIF[d.tipo].color }}>
      {conSigno(d)}
    </span>
  );
}

/** Turno, expected, counted, the signed difference and the review state. */
export function columnas(estado: (c: Corte) => EstadoCorte): readonly ColumnDef<Corte>[] {
  const chip = (c: Corte) => (
    <span
      className={s.chip}
      data-estado=""
      style={{ background: ESTADO[estado(c)].bg, color: ESTADO[estado(c)].color }}
    >
      {estado(c)}
    </span>
  );
  return [
    { key: 'turno', header: 'Turno', render: (c) => <Turno c={c} /> },
    { key: 'esperado', header: 'Esperado', numeric: true, render: (c) => formatMoney(esperado(c)) },
    { key: 'contado', header: 'Contado', numeric: true, render: (c) => formatMoney(contado(c)) },
    { key: 'diferencia', header: 'Diferencia', numeric: true, render: (c) => <Diferencia c={c} /> },
    { key: 'estado', header: 'Estado', numeric: true, render: chip },
  ];
}
