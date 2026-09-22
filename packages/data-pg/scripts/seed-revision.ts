/**
 * The counter-created records (O-37): Revisión de caja reviews real
 * `estado_revision = 'pendiente'` rows — two products (one with an approved
 * same-name duplicate, so merge has a target) and one client with fiado
 * facts, plus the sales that make «vendido sin costo».
 */

import type { Sql } from 'postgres';

import { BIZ, CREATED, DEV, id, TODAY, TS } from './seed-data.js';

export async function seedRevision(sql: Sql): Promise<void> {
  const pendientes: readonly [string, string, number][] = [
    [id('RVM3Q'), 'Michelada preparada', 75_00],
    [id('RVREF'), 'Refresco', 25_00],
  ];
  for (const [pid, nombre, precio] of pendientes) {
    await sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                            umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                            estado_revision, business_id, device_id, created_at, updated_at)
      VALUES (${pid}, ${nombre}, NULL, 'Producto Terminado', 0, 'pza', 3,
              'producto', true, ${precio}, 'pendiente', ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
      ON CONFLICT (id) DO NOTHING`;
  }
  await seedVentasMichelada(sql);
  await seedClienteRevision(sql);
}

/** Two sales of the michelada: the KPI's «vendido sin costo» ($150). */
async function seedVentasMichelada(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, cliente_id, estado_pago,
                         business_id, device_id, created_at, updated_at)
    VALUES (${id('RVTIK')}, 900, ${TODAY}, '14:05', 'Michelada preparada', 'Efectivo', NULL, 'pagado',
            ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
    ON CONFLICT (id) DO NOTHING`;
  const lineas: readonly [string, number][] = [
    [id('RVSA1'), 1],
    [id('RVSA2'), 1],
  ];
  for (const [sid, cantidad] of lineas) {
    await sql`
      INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                         producto_id, cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${sid}, ${id('RVTIK')}, ${TODAY}, 'Michelada preparada', 'Producto', ${75_00},
              ${id('RVM3Q')}, ${cantidad}, ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

/** One client with fiado: a $90 Crédito ticket minus a $20 abono. */
async function seedClienteRevision(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO clients (id, nombre, telefono, limite_centavos, plazo_dias, estado_revision,
                         business_id, device_id, created_at, updated_at)
    VALUES (${id('RVCHE')}, 'Doña Chelo', '3312 445 778', NULL, NULL, 'pendiente',
            ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO tickets (id, folio, fecha, hora, concepto, metodo, cliente_id, estado_pago,
                         business_id, device_id, created_at, updated_at)
    VALUES (${id('RVCHT')}, 901, ${TODAY}, '15:10', 'Orden de tacos', 'Crédito', ${id('RVCHE')},
            'pendiente', ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                       producto_id, cantidad, business_id, device_id, created_at, updated_at)
    VALUES (${id('RVCHS')}, ${id('RVCHT')}, ${TODAY}, 'Orden de tacos', 'Producto', ${90_00},
            ${id('PTAC1')}, 3, ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo,
                                 business_id, device_id, created_at, updated_at)
    VALUES (${id('RVCHA')}, ${id('RVCHE')}, ${TODAY}, ${20_00}, 'Efectivo',
            ${BIZ}, ${DEV}, ${TS(TODAY)}, ${TS(TODAY)})
    ON CONFLICT (id) DO NOTHING`;
}
