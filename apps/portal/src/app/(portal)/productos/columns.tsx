import { formatMoney } from '@xangarro/domain';

import { Button, StatusPill, type ColumnDef } from '@/components';

import { isLow, type Movimiento, type Producto } from './parts';

/**
 * The catalogue, plus an edit action when the viewer may write.
 *
 * A function rather than a constant because the action needs a callback, and
 * because `viewer` must not see the affordance at all — gating hides rather
 * than disables (`session/gating.ts`), and the server rejects regardless.
 */
/** What a row can ask for; the screen owns the dialogs. */
export type RowAction = 'editar' | 'movimiento';
export type OnRowAction = ((p: Producto, action: RowAction) => void) | null;

export function catalogoColumns(onAction: OnRowAction): readonly ColumnDef<Producto>[] {
  if (onAction === null) return CATALOGO_COLUMNS;
  return [
    ...CATALOGO_COLUMNS,
    {
      key: 'acciones',
      header: 'Acciones',
      render: (p) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" variant="secondary" onClick={() => onAction(p, 'editar')}>
            Editar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAction(p, 'movimiento')}>
            Movimiento
          </Button>
        </span>
      ),
    },
  ];
}

export const CATALOGO_COLUMNS: readonly ColumnDef<Producto>[] = [
  { key: 'nombre', header: 'Producto', render: (p) => p.nombre },
  { key: 'sku', header: 'SKU', render: (p) => p.sku },
  {
    key: 'categoria',
    header: 'Categoría',
    render: (p) => <StatusPill tone="soft">{p.categoria}</StatusPill>,
  },
  { key: 'precio', header: 'Precio', numeric: true, render: (p) => formatMoney(p.precio) },
  {
    key: 'stock',
    header: 'Existencias',
    numeric: true,
    render: (p) =>
      p.sigueStock ? (
        <StatusPill tone={isLow(p) ? 'danger' : 'success'}>
          {p.stock} · umbral {p.umbral}
        </StatusPill>
      ) : (
        'Sin inventario'
      ),
  },
];

export const MOV_COLUMNS: readonly ColumnDef<Movimiento>[] = [
  { key: 'fecha', header: 'Fecha', render: (m) => m.fecha },
  { key: 'producto', header: 'Producto', render: (m) => m.producto },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (m) => (
      <StatusPill tone={m.tipo === 'entrada' ? 'success' : 'soft'}>{m.motivo}</StatusPill>
    ),
  },
  {
    key: 'cambio',
    header: 'Cambio',
    numeric: true,
    render: (m) => (m.cambio > 0 ? `+${m.cambio}` : `${m.cambio}`),
  },
];
