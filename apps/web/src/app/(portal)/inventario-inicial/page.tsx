import { isNull } from 'drizzle-orm';
import { products } from '@xangarro/data-pg';

import { inventarioInicialYaCapturado } from '@/server/actions/apertura';
import { requireMember } from '@/server/auth';
import { withTenant } from '@/server/db';
import { hoy } from '@/server/clock';

import { InventarioInicialScreen } from './parts';

/**
 * «Captura tu inventario inicial» (N-17): one-time, owner/admin. Linked from
 * Negocio and the «¿Cómo empiezo?» checklist.
 */
export default async function InventarioInicialPage() {
  const session = await requireMember('viewer');
  const yaCapturado = await inventarioInicialYaCapturado(session.business_id);
  const productos = await withTenant(session.business_id, (tx) =>
    tx
      .select({ id: products.id, nombre: products.nombre, costo: products.costoUnitCentavos })
      .from(products)
      .where(isNull(products.deletedAt))
      .orderBy(products.nombre),
  );

  return (
    <InventarioInicialScreen
      mayWrite={session.member_role !== 'viewer'}
      yaCapturado={yaCapturado}
      hoy={hoy()}
      productos={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        costo: `${p.costo / 100n}.${(p.costo % 100n).toString().padStart(2, '0')}`,
      }))}
    />
  );
}
