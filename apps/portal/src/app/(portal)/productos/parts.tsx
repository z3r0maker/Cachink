'use client';

import { formatMoney } from '@xangarro/domain';

import {
  Banner,
  Button,
  DataTable,
  ExportButton,
  FilterChip,
  KpiCard,
  PendingButton,
  kpiGrid,
} from '@/components';
import type { ProductosData } from '@/server/screens';

import { catalogoColumns, MOV_COLUMNS, type OnRowAction } from './columns';
import { pageSubtitle, pageTitle, toolbar } from './productos.css';

export type Producto = ProductosData['catalogo'][number];
export type Movimiento = ProductosData['movimientos'][number];

/** Low stock is a product below its own threshold, not a global number. */
export const isLow = (p: Producto): boolean => p.sigueStock && p.stock <= p.umbral;

export function Heading({ mayWrite }: { readonly mayWrite: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Productos</h1>
        <p className={pageSubtitle}>Tu catálogo y el movimiento de tus existencias</p>
      </div>
      {mayWrite ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <ExportButton dataset="productos" />
          <PendingButton
            variant="primary"
            reason="Los productos se crean en el dispositivo; el portal los corrige (ADR-058 §2)."
          >
            Nuevo producto
          </PendingButton>
        </div>
      ) : null}
    </div>
  );
}

export function Kpis({ rows }: { readonly rows: readonly Producto[] }) {
  const valor = rows.reduce((t, p) => t + p.costo * BigInt(Math.max(p.stock, 0)), 0n);
  return (
    <div className={kpiGrid}>
      <KpiCard label="Productos activos" value={`${rows.length}`} hint="En tu catálogo" />
      <KpiCard label="Valor del inventario" value={formatMoney(valor)} hint="Al costo" />
      <KpiCard
        label="Stock bajo"
        value={`${rows.filter(isLow).length}`}
        tone="negative"
        hint="Por debajo del umbral"
      />
    </div>
  );
}

export function LowStockBanner({
  low,
  onShow,
}: {
  readonly low: number;
  readonly onShow: () => void;
}) {
  return (
    <Banner
      tone="critical"
      title={`${low} productos están por debajo de su umbral.`}
      body="Repón antes de que tus operadores se queden sin qué vender."
      action={
        <Button size="sm" variant="secondary" onClick={onShow}>
          Ver stock bajo
        </Button>
      }
    />
  );
}

export function Chips({
  filter,
  setFilter,
}: {
  readonly filter: string;
  readonly setFilter: (v: string) => void;
}) {
  return (
    <div className={toolbar}>
      {['Todos', 'Stock bajo'].map((f) => (
        <FilterChip key={f} label={f} selected={filter === f} onSelect={() => setFilter(f)} />
      ))}
    </div>
  );
}

export function CatalogoTable({
  rows,
  onAction,
}: {
  readonly rows: readonly Producto[];
  /** `null` for a viewer: the affordance is hidden, not disabled. */
  readonly onAction: OnRowAction;
}) {
  return (
    <DataTable
      caption="Catálogo"
      columns={catalogoColumns(onAction)}
      rows={rows}
      rowKey={(p) => p.id}
      minWidth={onAction === null ? 860 : 1060}
      footer={<span>Mostrando {rows.length} productos</span>}
    />
  );
}

export function MovTable({ rows }: { readonly rows: readonly Movimiento[] }) {
  return (
    <DataTable
      caption="Movimientos"
      columns={MOV_COLUMNS}
      rows={rows}
      rowKey={(m) => m.id}
      minWidth={720}
      footer={<span>Mostrando {rows.length} movimientos</span>}
    />
  );
}
