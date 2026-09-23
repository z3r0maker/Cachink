/** The demo tenant's month of ventas and gastos (B-04): deterministic ids, dates relative to the run. */

import type { Sql } from 'postgres';

import {
  dayBefore,
  DEMO,
  DEMO_EXPENSES,
  DEMO_METODOS,
  DEMO_PRODUCTS,
  demoId,
} from './seed-demo-data.js';

const DAYS = 30;
const TICKETS_PER_DAY = 3;
const OPENING_STOCK = 500;
const ts = (day: string, hour: number): string =>
  `${day}T${String(hour).padStart(2, '0')}:00:00.000Z`;

/** One opening `entrada` per product, the day before the first sale, so no product ever nets negative (ADR-095). */
export async function seedDemoOpeningStock(sql: Sql, today: Date): Promise<void> {
  const day = dayBefore(today, DAYS + 1);
  for (const [suffix, , , costo] of DEMO_PRODUCTS) {
    await sql`
      INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos,
                                       motivo, business_id, device_id, created_at, updated_at)
      VALUES (${demoId(`E${suffix.slice(1)}`)}, ${demoId(suffix)}, ${day}, 'entrada', ${OPENING_STOCK},
              ${costo}, 'Inventario inicial', ${DEMO.businessId}, ${DEMO.deviceId}, ${ts(day, 8)}, ${ts(day, 8)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

interface Venta {
  readonly n: number;
  readonly day: string;
  readonly hour: number;
  readonly product: (typeof DEMO_PRODUCTS)[number];
  readonly cantidad: number;
  readonly metodo: (typeof DEMO_METODOS)[number];
}

/** Ninety tickets over thirty days, rotating products, quantities and payment methods. */
function ventas(today: Date): Venta[] {
  const out: Venta[] = [];
  let n = 0;
  for (let daysAgo = DAYS; daysAgo >= 1; daysAgo -= 1) {
    for (let k = 0; k < TICKETS_PER_DAY; k += 1) {
      n += 1;
      const product = DEMO_PRODUCTS[(n * 7) % DEMO_PRODUCTS.length];
      const metodo = DEMO_METODOS[n % DEMO_METODOS.length];
      if (product === undefined || metodo === undefined) continue;
      out.push({
        n,
        day: dayBefore(today, daysAgo),
        hour: 13 + k * 3,
        product,
        cantidad: 1 + (n % 3),
        metodo,
      });
    }
  }
  return out;
}

async function insertVenta(sql: Sql, v: Venta): Promise<void> {
  const id = demoId(`T${String(v.n).padStart(4, '0')}`);
  const [pSuffix, nombre, , costo, precio] = v.product;
  const at = ts(v.day, v.hour);
  await sql`
    INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, business_id, device_id, created_at, updated_at)
    VALUES (${id}, ${v.n}, ${v.day}, ${nombre}, ${v.metodo}, 'pagado', ${DEMO.businessId}, ${DEMO.deviceId}, ${at}, ${at})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id, cantidad,
                       business_id, device_id, created_at, updated_at)
    VALUES (${id}, ${id}, ${v.day}, ${nombre}, 'Producto', ${precio * v.cantidad}, ${demoId(pSuffix)}, ${v.cantidad},
            ${DEMO.businessId}, ${DEMO.deviceId}, ${at}, ${at})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo,
                                     business_id, device_id, created_at, updated_at)
    VALUES (${demoId(`M${String(v.n).padStart(4, '0')}`)}, ${demoId(pSuffix)}, ${v.day}, 'salida', ${v.cantidad},
            ${costo}, 'Venta', ${DEMO.businessId}, ${DEMO.deviceId}, ${at}, ${at})
    ON CONFLICT (id) DO NOTHING`;
}

export async function seedDemoVentas(sql: Sql, today: Date): Promise<number> {
  const list = ventas(today);
  for (const v of list) await insertVenta(sql, v);
  return list.length;
}

/** Each expense once, spread over the month; the weekly ones (nómina) four times. */
export async function seedDemoGastos(sql: Sql, today: Date): Promise<number> {
  let n = 0;
  for (const [i, [concepto, categoria, monto]] of DEMO_EXPENSES.entries()) {
    const times = categoria === 'Nómina' ? 4 : 1;
    for (let k = 0; k < times; k += 1) {
      n += 1;
      const day = dayBefore(today, DAYS - i * 2 - k * 7);
      await sql`
        INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
        VALUES (${demoId(`X${String(n).padStart(4, '0')}`)}, ${day}, ${concepto}, ${categoria}, ${monto},
                ${DEMO.businessId}, ${DEMO.deviceId}, ${ts(day, 10)}, ${ts(day, 10)})
        ON CONFLICT (id) DO NOTHING`;
    }
  }
  return n;
}
