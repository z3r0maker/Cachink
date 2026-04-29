/**
 * MovimientosRoute — smart wrapper that wires MovimientosScreen to
 * useMovimientosRecientes + useProductos (Slice 9.6 T08).
 *
 * Both apps previously had no "/inventario/movimientos" screen even
 * though MovimientosScreen + MovimientoCard + useMovimientosRecientes
 * shipped in Phase 1C. This wrapper lives inside `@cachink/ui` so
 * mobile + desktop just mount `<MovimientosRoute />` as the
 * Movimientos sub-tab body.
 */

import type { ReactElement } from 'react';
import type { Product, ProductId } from '@cachink/domain';
import { useMovimientosRecientes } from '../../hooks/use-movimientos-recientes';
import { useProductos } from '../../hooks/use-productos';
import { MovimientosScreen } from './movimientos-screen';

export function MovimientosRoute(): ReactElement {
  const movsQ = useMovimientosRecientes();
  const prodsQ = useProductos();

  const productosById = new Map<ProductId, Product>();
  for (const p of prodsQ.data ?? []) productosById.set(p.id, p);

  return <MovimientosScreen movimientos={movsQ.data ?? []} productosById={productosById} />;
}
