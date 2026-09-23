import { formatMoney } from '@xangarro/domain';

import { Button, StatusPill, type ColumnDef } from '@/components';

import { CategoriaPill, ExistenciasCell, ProductoCell } from './celdas';
import { type Movimiento, type Producto } from './parts';

/**
 * The catalogue, plus an edit action when the viewer may write.
 *
 * A function rather than a constant because the action needs a callback, and
 * because `viewer` must not see the affordance at all — gating hides rather
 * than disables (`session/gating.ts`), and the server rejects regardless.
 */
/** What a row can ask for; the screen owns the dialogs. */
export type RowAction = 'editar' | 'movimiento' | 'archivar';
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
          <Button size="sm" variant="secondary" onClick={() => onAction(p, 'archivar')}>
            Archivar
          </Button>
        </span>
      ),
    },
  ];
}

/**
 * The SKU has no column of its own any more: the design stacks it under the
 * name inside the Producto cell, beside the category-coloured tile (B-5).
 */
export const CATALOGO_COLUMNS: readonly ColumnDef<Producto>[] = [
  { key: 'nombre', header: 'Producto', render: (p) => <ProductoCell p={p} /> },
  {
    key: 'categoria',
    header: 'Categoría',
    render: (p) => <CategoriaPill categoria={p.categoria} />,
  },
  { key: 'precio', header: 'Precio', numeric: true, render: (p) => formatMoney(p.precio) },
  {
    key: 'stock',
    header: 'Existencias',
    numeric: true,
    render: (p) => <ExistenciasCell p={p} />,
  },
];

/** Venta yellow, Entrada green, Merma red, Ajuste blue — the design's four. */
const TONO_MOVIMIENTO: Record<string, 'soft' | 'success' | 'danger' | 'info'> = {
  Venta: 'soft',
  Entrada: 'success',
  Merma: 'danger',
  Ajuste: 'info',
};

/** The motivo is free text; match on the word the design keys its tone to. */
function tonoDeMotivo(m: Movimiento): 'soft' | 'success' | 'danger' | 'info' {
  const motivo = m.motivo.toLocaleLowerCase('es-MX');
  if (motivo.includes('merma')) return TONO_MOVIMIENTO.Merma as 'danger';
  if (motivo.includes('ajuste')) return TONO_MOVIMIENTO.Ajuste as 'info';
  if (motivo.includes('venta')) return TONO_MOVIMIENTO.Venta as 'soft';
  return m.tipo === 'entrada' ? 'success' : 'soft';
}

export const MOV_COLUMNS: readonly ColumnDef<Movimiento>[] = [
  { key: 'fecha', header: 'Fecha', render: (m) => m.fecha },
  { key: 'producto', header: 'Producto', render: (m) => m.producto },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (m) => <StatusPill tone={tonoDeMotivo(m)}>{m.motivo}</StatusPill>,
  },
  {
    key: 'cambio',
    header: 'Cambio',
    numeric: true,
    render: (m) => (m.cambio > 0 ? `+${m.cambio}` : `${m.cambio}`),
  },
];
