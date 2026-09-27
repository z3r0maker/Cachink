/**
 * The business as its receipts print it, from the register's own database:
 * the bootstrap and every pull keep `businesses` current, so what the owner
 * sets in Mi negocio › Comprobantes (logo, leyenda, WhatsApp, address) is what
 * the caja's receipt says, offline too.
 */

import { DrizzleBusinessesRepository } from '@xangarro/data';
import type { BusinessId } from '@xangarro/domain';

import type { Db } from './db-types';

export interface MarcaDelNegocio {
  readonly nombre: string;
  readonly logoUrl: string | null;
  readonly leyenda: string | null;
  readonly whatsapp: string | null;
  /** Only when the owner chose to print it. */
  readonly direccion: string | null;
}

export async function marcaDelNegocio(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
): Promise<MarcaDelNegocio | null> {
  const b = await new DrizzleBusinessesRepository(db as never, deviceId as never).findById(
    businessId,
  );
  if (b === null) return null;
  const limpio = (s: string | null | undefined) =>
    s === null || s === undefined || s.trim() === '' ? null : s.trim();
  return {
    nombre: b.nombre,
    logoUrl: limpio(b.logoUrl),
    leyenda: limpio(b.receiptLeyenda),
    whatsapp: limpio(b.whatsapp),
    direccion: b.addressPrint ? limpio(b.direccion) : null,
  };
}
