'use client';

import { ExportButton, SegmentedTabs, type Exportacion } from '@/components';

import * as s from './movimientos-tab.css';

/** `listMovimientosInventario` lists the newest fifty; the export has every one. */
export const RECIENTES = 50;

export function Tabs({
  tab,
  onChange,
  catalogCount,
  movCount,
}: {
  readonly tab: string;
  readonly onChange: (v: string) => void;
  readonly catalogCount: number;
  readonly movCount: number;
}) {
  return (
    <SegmentedTabs
      ariaLabel="Productos"
      value={tab}
      onValueChange={onChange}
      tabs={[
        { value: 'catalogo', label: 'Catálogo', count: catalogCount },
        { value: 'movimientos', label: 'Movimientos', count: movCount },
      ]}
    />
  );
}

/** Productos › Movimientos' header action: the whole history, not the 50 listed (DS-02). */
export function ExportarMovimientos({ exp }: { readonly exp: Exportacion }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <ExportButton
        dataset="movimientos"
        label="Exportar movimientos"
        formato="XLSX"
        control={exp}
      />
    </div>
  );
}

/**
 * The footer says the list is the newest fifty, not the history, and offers
 * the rest (DS-04). Same export as the header button: one request, one wait.
 */
export function PieMovimientos({
  total,
  exp,
}: {
  readonly total: number;
  readonly exp: Exportacion;
}) {
  return (
    <span className={s.pie} data-testid="movimientos-pie">
      <span>
        {total >= RECIENTES
          ? `Mostrando los ${RECIENTES} más recientes`
          : `Mostrando ${total} movimientos`}{' '}
        ·
      </span>
      <button
        type="button"
        className={s.exportarTodos}
        onClick={exp.exportar}
        disabled={exp.preparando}
      >
        Exportar todos
      </button>
    </span>
  );
}
