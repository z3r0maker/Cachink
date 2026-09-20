/**
 * The register's catalogue, read from its own database (O-06 slice 3): after
 * vincular, the bootstrap (and every pull) keeps `products` current — the
 * linked register sells what the owner manages, not the design fixture.
 */

import { DrizzleProductsRepository } from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';

import type { Db } from './db-types';

export interface ProductoDeCaja {
  readonly id: string;
  readonly nombre: string;
  /** Centavos, as everything money. */
  readonly precio: string;
  readonly categoria: string;
}

export async function catalogo(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<readonly ProductoDeCaja[]> {
  const rows = await new DrizzleProductsRepository(db as never, deviceId as never).listForBusiness(
    businessId,
  );
  return rows
    .filter((p) => p.deletedAt === null && p.estadoRevision !== 'pendiente')
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precioVentaCentavos.toString(),
      categoria: p.categoria,
    }));
}
