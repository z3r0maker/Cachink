import { and, eq, isNull, sql } from 'drizzle-orm';

import type { Db } from '../client.js';
import { dayCloses } from '../schema/caja.js';
import { inventoryMovements, products } from '../schema/catalog.js';
import { clientPayments } from '../schema/ledger.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

type FechaCol =
  | typeof clientPayments.fecha
  | typeof dayCloses.fecha
  | typeof inventoryMovements.fecha;

const enRango = (col: FechaCol, from: string, to: string) =>
  sql`left(${col}, 10) BETWEEN ${from} AND ${to}`;

/** The period's nightly cortes — the raw cash positions the Balance nets. */
function cortesDelPeriodo(tx: Tx, from: string, to: string) {
  return tx
    .select({
      fecha: dayCloses.fecha,
      deviceId: dayCloses.deviceId,
      createdAt: dayCloses.createdAt,
      efectivoContadoCentavos: dayCloses.efectivoContadoCentavos,
    })
    .from(dayCloses)
    .where(and(isNull(dayCloses.deletedAt), enRango(dayCloses.fecha, from, to)));
}

/** Payments received against credit sales inside the period. */
function pagosDelPeriodo(tx: Tx, from: string, to: string) {
  return tx
    .select({ ventaId: clientPayments.ventaId, montoCentavos: clientPayments.montoCentavos })
    .from(clientPayments)
    .where(and(isNull(clientPayments.deletedAt), enRango(clientPayments.fecha, from, to)));
}

/**
 * Stock snapshot per product at cost: entradas minus every salida — Ventas
 * and mermas alike, since both leave the inventory. Current, not
 * period-scoped, mirroring the phone's documented choice (its plan risk #3).
 */
function stockACosto(tx: Tx) {
  return tx
    .select({
      costoUnitCentavos: products.costoUnitCentavos,
      cantidad: sql<number>`coalesce(sum(case when ${inventoryMovements.tipo} = 'entrada'
                                            then ${inventoryMovements.cantidad}
                                            else -${inventoryMovements.cantidad} end), 0)::int`,
    })
    .from(products)
    .leftJoin(
      inventoryMovements,
      and(eq(inventoryMovements.productoId, products.id), isNull(inventoryMovements.deletedAt)),
    )
    .where(isNull(products.deletedAt))
    .groupBy(products.id, products.costoUnitCentavos);
}

/**
 * The period's merma at cost. The cloud's `tipo` enum has no merma member —
 * a merma is a `salida` whose motivo is «Merma / daño», the domain's rule.
 */
function mermasDelPeriodo(tx: Tx, from: string, to: string) {
  return tx
    .select({
      cantidad: inventoryMovements.cantidad,
      costoUnitCentavos: inventoryMovements.costoUnitCentavos,
    })
    .from(inventoryMovements)
    .where(
      and(
        isNull(inventoryMovements.deletedAt),
        eq(inventoryMovements.tipo, 'salida'),
        eq(inventoryMovements.motivo, 'Merma / daño'),
        enRango(inventoryMovements.fecha, from, to),
      ),
    );
}

/**
 * The real inputs the Balance (NIF B-6), the Flujo (NIF B-2) and the
 * Indicadores need for a period (finding F-1), mirroring the phone's
 * composition (`use-balance-general.ts`, `use-flujo-efectivo.ts`,
 * `use-indicadores.ts`) so both clients feed the domain the same rows.
 * Ventas con crédito come from `periodLedger`; the caller filters them
 * exactly as the phone does.
 */
export async function periodBalanceInputs(tx: Tx, from: string, to: string) {
  const [cortes, pagos, stock, merma] = await Promise.all([
    cortesDelPeriodo(tx, from, to),
    pagosDelPeriodo(tx, from, to),
    stockACosto(tx),
    mermasDelPeriodo(tx, from, to),
  ]);
  return { cortes, pagos, stock, merma };
}
