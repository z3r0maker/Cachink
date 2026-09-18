'use client';

import { formatMoney } from '@xangarro/domain';

import { ExportButton, FilterChip, StatusPill, Tag, type ColumnDef } from '@/components';
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

export function SearchAndRange({
  query,
  onQuery,
  range,
  onRange,
  ranges,
}: {
  readonly query: string;
  readonly onQuery: (v: string) => void;
  readonly range: string;
  readonly onRange: (v: string) => void;
  readonly ranges: readonly string[];
}) {
  return (
    <div className={toolbar}>
      <input
        className={search}
        placeholder="Buscar por concepto, folio u operador"
        aria-label="Buscar movimientos"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
      />
      {ranges.map((r) => (
        <FilterChip key={r} label={r} selected={range === r} onSelect={() => onRange(r)} />
      ))}
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
