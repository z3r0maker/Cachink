import { formatMoney } from '@xangarro/domain';

import { StatusPill, type ColumnDef } from '@/components';

import { isLow, type Movimiento, type Producto } from './parts';

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
