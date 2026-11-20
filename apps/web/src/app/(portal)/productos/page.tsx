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

export default async function ProductosPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly filtro?: string; readonly editar?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const filtro = params.filtro === 'bajo' ? 'bajo' : 'todos';
  // `?editar=<id>`: «Ver ese producto» from a repeated barcode (P-44).
  const editar = params.editar ?? null;
  try {
    return (
      <ProductosScreen
        data={await loadProductos(session.business_id)}
        filtroInicial={filtro}
        editarInicial={editar}
      />
    );
  } catch {
    return <ProductosScreen data={null} filtroInicial={filtro} />;
  }
}
