import { requireSession } from '@/server/auth';
import { loadProductos } from '@/server/screens';

import { ProductosScreen } from './screen';

/**
 * Productos — the catalog and the inventory ledger (P-07). **Reads Postgres.**
 *
 * Movimientos is read-only: `inventory_movements` is an UP table with no down
 * path, so "Ajustar inventario" and "Registrar movimiento" do not exist
 * (ADR-058 §2).
 */
export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  const session = await requireSession();
  try {
    return <ProductosScreen data={await loadProductos(session.business_id)} />;
  } catch {
    return <ProductosScreen data={null} />;
  }
}
