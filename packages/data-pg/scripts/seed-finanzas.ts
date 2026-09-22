import type postgres from 'postgres';

import { BIZ, CLIENTS, COST, DEV, PRODUCTS, id, peso, TS } from './seed-data.js';
import { seedMes } from './seed-finanzas-mes.js';

type Sql = ReturnType<typeof postgres>;

/**
 * The financial seed — two months of a real ledger so the estados show truth.
 *
 * The design fixtures in `seed-data` are frozen in May 2026; the estados query
 * the *current* period, so a demo seeded from them reads "sin datos" the
 * moment the calendar moves. This generator anchors every fecha to the day the
 * seed runs (previous month complete + current month to date), and derives ids
 * from that anchor, so re-running in a later month APPENDS its rows instead of
 * silently no-opping — history grows the way a real business's would.
 *
 * What it adds beyond the fixtures, because the estados need them: the apertura
 * (opening caja/bancos + per-cliente saldos + the day-one inventory
 * valuation), Crédito tickets left pendiente (CxC on the balance), an abono
 * (client payment), Nómina/Renta/Inventario egresos, a monthly merma, and a
 * corte per operating day whose esperado is that day's Efectivo.
 *
 * Montos: apertura y abono se escriben con `peso()` (literales en pesos); el
 * resto del archivo hermano es centavos crudos, como los fixtures.
 */

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const monthTag = (d: Date): string =>
  `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

function monthDays(anchor: Date, previous: boolean): readonly string[] {
  const y = anchor.getUTCFullYear();
  const m = anchor.getUTCMonth();
  const first = previous ? new Date(Date.UTC(y, m - 1, 1)) : new Date(Date.UTC(y, m, 1));
  const last = previous ? new Date(Date.UTC(y, m, 0)) : anchor;
  const days: string[] = [];
  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) days.push(iso(d)); // Sundays the taquería rests
  }
  return days;
}

/** Day-one facts: caja/bancos, saldos per cliente, and the inventory valuation. */
async function seedApertura(sql: Sql, anchor: Date): Promise<void> {
  const fecha = iso(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 0)));
  await sql`
    INSERT INTO opening_balances (id, fecha_apertura, caja_centavos, bancos_centavos,
                                  business_id, device_id, created_at, updated_at)
    VALUES (${id('FZB01')}, ${fecha}, ${peso(3500)}, ${peso(12000)},
            ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
    ON CONFLICT (id) DO NOTHING`;
  for (const [i, cliente] of CLIENTS.entries()) {
    await sql`
      INSERT INTO opening_balance_clients (id, cliente_id, saldo_centavos,
                                           business_id, device_id, created_at, updated_at)
      VALUES (${id(`FPC${String(i).padStart(2, '0')}`)}, ${cliente[0]}, ${peso(400 + i * 150)},
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [j, [productoId]] of PRODUCTS.entries()) {
    await sql`
      INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                       costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
      VALUES (${id(`FPN${String(j).padStart(2, '0')}`)}, ${productoId}, ${fecha}, 'entrada', 40,
              ${COST[productoId] ?? 0}, 'Ajuste de inventario', ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

export async function seedFinanzas(sql: Sql, anchor = new Date()): Promise<void> {
  await seedApertura(sql, anchor);
  await seedMes(sql, `${monthTag(anchor)}P`, monthDays(anchor, true), 1000);
  await seedMes(sql, `${monthTag(anchor)}C`, monthDays(anchor, false), 2000);
  // Doña Mari pays down part of her crédito, in cash, mid-current-month.
  const abonoDia = iso(
    new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), Math.min(15, anchor.getUTCDate())),
    ),
  );
  await sql`
    INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo, nota,
                                 business_id, device_id, created_at, updated_at)
    VALUES (${id('FAB01')}, ${CLIENTS[0][0]}, ${abonoDia}, ${peso(200)}, 'Efectivo',
            'Abono a la cuenta', ${BIZ}, ${DEV}, ${TS(abonoDia)}, ${TS(abonoDia)})
    ON CONFLICT (id) DO NOTHING`;
}
