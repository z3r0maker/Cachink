'use client';

import { formatMoney } from '@xangarro/domain';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Button,
  DonDice,
  DataTable,
  ExportButton,
  FilterChip,
  KpiCard,
  kpiGrid,
} from '@/components';
import { button } from '@/components/button.css';
import type { ProductosData } from '@/server/screens';

import { margenPromedio } from './derive';

import { catalogoColumns, MOV_COLUMNS, type OnRowAction } from './columns';
import { pageSubtitle, pageTitle, toolbar } from './productos.css';

export type Producto = ProductosData['catalogo'][number];
export type Movimiento = ProductosData['movimientos'][number];

/** Low stock is a product below its own threshold, not a global number. */
export const isLow = (p: Producto): boolean => p.sigueStock && p.stock <= p.umbral;

export function Heading({ mayWrite }: { readonly mayWrite: boolean }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div>
        <h1 className={pageTitle}>Productos</h1>
        <p className={pageSubtitle}>Tu catálogo y el movimiento de tus existencias</p>
      </div>
      {mayWrite ? (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <ExportButton dataset="productos" />
          <Button variant="secondary" onClick={() => router.push('/importar?plantilla=productos')}>
            Importar desde Excel
          </Button>
          <Link href="/productos/nuevo" className={button({ variant: 'primary' })}>
            Nuevo producto
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function Kpis({ rows }: { readonly rows: readonly Producto[] }) {
  const valor = rows.reduce((t, p) => t + p.costo * BigInt(Math.max(p.stock, 0)), 0n);
  const margen = margenPromedio(rows);
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
      <KpiCard
        label="Margen promedio"
        value={margen === null ? '—' : `${Math.round(margen * 100)}%`}
        // The design paints it green from 55% up.
        tone={margen !== null && margen >= 0.55 ? 'positive' : 'neutral'}
        hint="Sobre el precio de venta"
      />
    </div>
  );
}

/**
 * The Movimientos tab had no KPI row at all (B-6). The four the design names
 * are counted from the movements already on screen, so they answer for
 * exactly what the table shows — «del periodo», not «del mes», because the
 * list is the latest 50 rather than a calendar window.
 */
export function KpisMovimientos({ rows }: { readonly rows: readonly Movimiento[] }) {
  const cuenta = (p: (m: Movimiento) => boolean) => `${rows.filter(p).length}`;
  const es = (m: Movimiento, palabra: string) =>
    m.motivo.toLocaleLowerCase('es-MX').includes(palabra);
  return (
    <div className={kpiGrid}>
      <KpiCard label="Movimientos del periodo" value={`${rows.length}`} hint="Los más recientes" />
      <KpiCard
        label="Entradas"
        value={cuenta((m) => m.tipo === 'entrada')}
        tone="positive"
        hint="Lo que sumó a tus existencias"
      />
      <KpiCard
        label="Mermas"
        value={cuenta((m) => es(m, 'merma'))}
        tone="negative"
        hint="Producto perdido o dañado"
      />
      <KpiCard
        label="Ajustes manuales"
        value={cuenta((m) => es(m, 'ajuste'))}
        hint="Correcciones a mano"
      />
    </div>
  );
}

/**
 * Don Cuentas on what is running out (ADR-107): how many are low, how many
 * already went negative — sold more than was captured — and «Ver solo esos».
 */
export function LowStockBanner({
  low,
  negativos,
  onShow,
}: {
  readonly low: number;
  readonly negativos: number;
  readonly onShow: () => void;
}) {
  const cuantos = low === 1 ? 'Un producto se está acabando' : `${low} productos se están acabando`;
  const neg =
    negativos === 0
      ? '. Repón antes de que tus cajas se queden sin qué vender.'
      : ` y ${negativos} ya ${negativos === 1 ? 'va' : 'van'} en negativo: se vendió más de lo que capturaste. Registra la compra para que cuadre.`;
  return (
    <DonDice pose="preocupado" size={80} tone="rojo">
      {cuantos}
      {neg}{' '}
      <Button size="sm" variant="secondary" onClick={onShow}>
        Ver solo esos
      </Button>
    </DonDice>
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
      minWidth={onAction === null ? 860 : 1160}
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
