import { SESSION } from '@/fixtures/business';
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
  try {
    return <ProductosScreen data={await loadProductos(SESSION.businessId)} />;
  } catch {
    return <ProductosScreen data={null} />;
  }
}
