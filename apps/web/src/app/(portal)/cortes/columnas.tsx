import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import type { ColumnDef } from '@/components';
import { DIF } from '@xangarro/caja/cierre';

import * as s from './cortes.css';
import { conSigno, contado, diferencia, esperado } from './derive';
import type { Corte, EstadoCorte } from './types';

export const ESTADO: Record<EstadoCorte, { bg: string; color: string }> = {
  Cuadró: { bg: colors.greenSoft, color: colors.greenText },
  'Por aclarar': { bg: colors.warningSoft, color: colors.warningText },
  Aclarado: { bg: colors.blueSoft, color: colors.blueText },
};

/** The review state with its dot, in the list and in the panel's head. */
export function EstadoPill({ estado }: { readonly estado: EstadoCorte }) {
  return (
    <span
      className={s.chip}
      data-estado=""
      style={{ background: ESTADO[estado].bg, color: ESTADO[estado].color }}
    >
      <span className={s.punto} aria-hidden="true" />
      {estado}
    </span>
  );
}

function Turno({ c }: { readonly c: Corte }) {
  return (
    <div className={s.turno}>
      <span className={s.avatar} style={{ background: c.tint }} aria-hidden="true">
        {c.iniciales}
      </span>
      <div style={{ minWidth: 0 }}>
        <div className={s.nombre}>{c.operador}</div>
        <div className={s.linea}>{`${c.caja} · ${c.dia} · ${c.horario}`}</div>
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
  return [
    { key: 'turno', header: 'Turno', render: (c) => <Turno c={c} /> },
    { key: 'esperado', header: 'Esperado', numeric: true, render: (c) => formatMoney(esperado(c)) },
    { key: 'contado', header: 'Contado', numeric: true, render: (c) => formatMoney(contado(c)) },
    { key: 'diferencia', header: 'Diferencia', numeric: true, render: (c) => <Diferencia c={c} /> },
    {
      key: 'estado',
      header: 'Estado',
      numeric: true,
      render: (c) => <EstadoPill estado={estado(c)} />,
    },
  ];
}
