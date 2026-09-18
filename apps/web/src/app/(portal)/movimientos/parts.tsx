'use client';

import { formatMoney } from '@xangarro/domain';

import { ExportButton, FilterChip, Input, StatusPill, Tag, type ColumnDef } from '@/components';
import type { MovimientosData } from '@/server/screens';

import {
  amountCell,
  cancelledAmount,
  conceptCell,
  pageSubtitle,
  pageTitle,
  search,
  toolbar,
} from './movimientos.css';
import type { Personalizado, RangoChip } from './periodo';

export type Row = MovimientosData[number];

export function Heading({ kind }: { readonly kind: 'ventas' | 'gastos' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Movimientos</h1>
        <p className={pageSubtitle}>Todas las ventas y gastos capturados en tus dispositivos</p>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        {/* Export is open to every plan and every role, including the contador. */}
        <ExportButton dataset={kind} />
      </div>
    </div>
  );
}

/** Personalizado's two dates; either may stay empty (open on that side). */
function CustomRange(props: {
  readonly custom: Personalizado;
  readonly onCustom: (v: Personalizado) => void;
}) {
  return (
    <>
      <Input
        labelText="Desde"
        type="date"
        value={props.custom.desde}
        onChange={(e) => props.onCustom({ ...props.custom, desde: e.target.value })}
        data-testid="rango-desde"
      />
      <Input
        labelText="Hasta"
        type="date"
        value={props.custom.hasta}
        onChange={(e) => props.onCustom({ ...props.custom, hasta: e.target.value })}
        data-testid="rango-hasta"
      />
    </>
  );
}

export function SearchAndRange(props: {
  readonly query: string;
  readonly onQuery: (v: string) => void;
  readonly range: RangoChip;
  readonly onRange: (v: RangoChip) => void;
  readonly ranges: readonly { value: RangoChip; label: string }[];
  readonly custom: Personalizado;
  readonly onCustom: (v: Personalizado) => void;
}) {
  return (
    <div className={toolbar}>
      <input
        className={search}
        placeholder="Buscar por concepto, folio u operador"
        aria-label="Buscar movimientos"
        value={props.query}
        onChange={(e) => props.onQuery(e.target.value)}
      />
      {props.ranges.map((r) => (
        <FilterChip
          key={r.value}
          label={r.label}
          selected={props.range === r.value}
          onSelect={() => props.onRange(r.value)}
        />
      ))}
      {props.range === 'personalizado' ? (
        <CustomRange custom={props.custom} onCustom={props.onCustom} />
      ) : null}
    </div>
  );
}

export function CategoryChips({
  chips,
  filter,
  onFilter,
}: {
  readonly chips: readonly string[];
  readonly filter: string | null;
  readonly onFilter: (v: string | null) => void;
}) {
  return (
    <div className={toolbar}>
      <FilterChip label="Todos" selected={filter === null} onSelect={() => onFilter(null)} />
      {chips.map((c) => (
        <FilterChip
          key={c}
          label={c}
          selected={filter === c}
          onSelect={() => onFilter(filter === c ? null : c)}
        />
      ))}
    </div>
  );
}

export const COLUMNS: readonly ColumnDef<Row>[] = [
  { key: 'fecha', header: 'Fecha', render: (m) => m.fecha },
  {
    key: 'concepto',
    header: 'Concepto',
    render: (m) => (
      <span className={conceptCell}>
        {m.concepto}
        {m.cancelada ? <Tag tone="danger">Cancelada</Tag> : null}
      </span>
    ),
  },
  {
    key: 'clasificacion',
    header: 'Método / Categoría',
    render: (m) => (
      <StatusPill tone={m.kind === 'venta' ? 'info' : 'peach'}>{m.clasificacion}</StatusPill>
    ),
  },
  {
    key: 'monto',
    header: 'Monto',
    numeric: true,
    render: (m) => (
      <span className={m.cancelada ? cancelledAmount : amountCell} data-kind={m.kind}>
        {m.kind === 'venta' ? '+' : '−'}
        {formatMoney(m.amount)}
      </span>
    ),
  },
];
