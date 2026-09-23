import type postgres from 'postgres';

import { BIZ, COST, DEV, id, TS } from './seed-data.js';

type Sql = ReturnType<typeof postgres>;

/**
 * The stock half of the financial seed: every movement row it writes, and the
 * weekly restock that keeps the ledger honest.
 *
 * The month generator used to emit a `salida` per ticket and nothing else, so
 * two months of ventas ran against the six fixture compras and the day-one
 * ajuste — 479 units in, 637 out. Four of six productos netted negative, and
 * the Balance's Inventarios line read **−$3,353.90**: a seed that sold what it
 * had never bought. A fixture whose own arithmetic is impossible is not a
 * fixture, it is a trap — the same lesson `seed-contract.integration.test.ts`
 * already records about ids and enums, in the one place it had not been
 * applied yet.
 *
 * So Pedro buys what he sells. Each week's tickets are tallied per producto
 * and a single `entrada` lands on that week's first operating day, sized to
 * that week's consumption rounded up to a purchase lot. Every week therefore
 * brings in at least what it took out, and the fixture's own compras plus the
 * day-one ajuste stay on the shelf as the opening buffer the merma eats into
 * — so no producto can net negative, whatever the PRNG rolls.
 */

/** Units a purchase comes in — nobody buys 17 refrescos. */
const LOTE = 10;

/** Units sold per productoId inside one week; the ticket generator fills it. */
export type Consumo = Map<string, number>;

let RESTOCK_SEQ = 1;

/** One inventory movement — a venta's salida, a merma, or a weekly restock. */
export async function movimiento(
  sql: Sql,
  mid: string,
  productoId: string,
  fecha: string,
  tipo: 'entrada' | 'salida',
  cantidad: number,
  costo: number,
  motivo: string,
): Promise<void> {
  await sql`
    INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                     costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
    VALUES (${id(mid)}, ${productoId}, ${fecha}, ${tipo}, ${cantidad},
            ${costo}, ${motivo}, ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
    ON CONFLICT (id) DO NOTHING`;
}

/** What the week's compra buys: its consumption, rounded up to whole lots. */
export function loteDeCompra(consumido: number): number {
  return Math.ceil(consumido / LOTE) * LOTE;
}

/**
 * The week's compra a proveedor — one `entrada` per producto the week sold,
 * dated on its first operating day, so no producto ever nets negative.
 */
export async function reponerStock(sql: Sql, fecha: string, consumo: Consumo): Promise<void> {
  for (const [productoId, consumido] of [...consumo].sort()) {
    await movimiento(
      sql,
      `FR${String(RESTOCK_SEQ++).padStart(3, '0')}`,
      productoId,
      fecha,
      'entrada',
      loteDeCompra(consumido),
      COST[productoId] ?? 0,
      'Compra a proveedor',
    );
  }
}

/**
 * The month's operating days in weeks of six — the taquería rests on Sundays,
 * so a six-day run is a calendar week and the compra lands on its Monday.
 */
export function semanas(days: readonly string[]): readonly (readonly string[])[] {
  const out: string[][] = [];
  for (let i = 0; i < days.length; i += 6) out.push(days.slice(i, i + 6));
  return out;
}
