/**
 * Seed — Taquería Don Pedro (B-04).
 *
 * The business every design file uses. It exists so local development and App
 * Review have something truthful to look at, and so the portal's screens can be
 * verified against real rows rather than fixtures. The rows themselves live in
 * `./seed-data`.
 *
 * Runs through the **app role**, so every insert passes the same RLS policy a
 * request does. Seeding as a superuser would prove nothing.
 *
 *   pnpm --filter @xangarro/data-pg db:seed
 */
import postgres from 'postgres';

import {
  BIZ,
  COST,
  CREATED,
  DEV,
  DAY_CLOSE_ID,
  DEVICES,
  EMPLOYEES,
  EXPENSES,
  MOVEMENTS,
  movementIdFor,
  NOTICES,
  PRODUCTS,
  REJECTING_DEVICE,
  REJECTIONS,
  SALES,
  TODAY,
  TS,
  USERS,
  peso,
} from './seed-data';

const URL = process.env.DATABASE_URL;
if (URL === undefined) {
  console.error('DATABASE_URL is required. Try: pnpm db:up');
  process.exit(1);
}

type Sql = ReturnType<typeof postgres>;

async function seedBusiness(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
    VALUES (${BIZ}, 'Taquería Don Pedro', 'RESICO', 125, ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre`;
}

async function seedProducts(sql: Sql): Promise<void> {
  for (const [id, nombre, sku, costo, precio, umbral, stock] of PRODUCTS) {
    await sql`
      INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                            umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                            business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${sku}, 'Producto Terminado', ${costo}, 'pza', ${umbral},
              'producto', ${stock}, ${precio}, ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}

/**
 * Every sale moves stock out. `cantidad` is always positive; the direction is
 * carried by `tipo`, per the schema's own rule.
 */
async function seedSales(sql: Sql): Promise<void> {
  for (const [id, fecha, concepto, productoId, cantidad, monto, metodo] of SALES) {
    await sql`
      INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago,
                         producto_id, cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${fecha}, ${concepto}, 'Producto', ${monto}, ${metodo}, 'pagado',
              ${productoId}, ${cantidad}, ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
    await sql`
      INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                       costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
      VALUES (${movementIdFor(id)}, ${productoId}, ${fecha}, 'salida', ${cantidad},
              ${COST[productoId] ?? 0}, 'Venta', ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedExpenses(sql: Sql): Promise<void> {
  for (const [id, fecha, concepto, categoria, monto] of EXPENSES) {
    await sql`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos,
                            business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${fecha}, ${concepto}, ${categoria}, ${monto},
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedMovements(sql: Sql): Promise<void> {
  for (const [id, productoId, fecha, tipo, cantidad, costo] of MOVEMENTS) {
    await sql`
      INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                       costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${productoId}, ${fecha}, ${tipo}, ${cantidad}, ${costo}, 'Compra',
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedDayClose(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos,
                            diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
    VALUES (${DAY_CLOSE_ID}, '2026-05-11', ${peso(2118)}, ${peso(2112)}, ${-peso(6)}, 'Director',
            ${BIZ}, ${DEV}, ${TS('2026-05-11')}, ${TS('2026-05-11')})
    ON CONFLICT (id) DO NOTHING`;
}

async function seedPeople(sql: Sql): Promise<void> {
  const PIN = '$2b$10$seedseedseedseedseedse';
  for (const [id, nombre, color, puedeCancelar] of USERS) {
    await sql`
      INSERT INTO users (id, nombre, pin_hash, recovery_password_hash, must_change_pin, avatar_color, permissions, role,
                         business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${PIN}, ${PIN}, false, ${color},
              ${JSON.stringify({ canCancelSales: puedeCancelar })}, 'operativo',
              ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [id, nombre, puesto, salario, periodo] of EMPLOYEES) {
    await sql`
      INSERT INTO employees (id, nombre, puesto, salario_centavos, periodo,
                             business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${puesto}, ${salario}, ${periodo},
              ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function seedPortal(sql: Sql): Promise<void> {
  const now = TS(TODAY);
  for (const [id, nombre, plataforma, modelo, lastPush] of DEVICES) {
    await sql`
      INSERT INTO devices (id, nombre, plataforma, modelo, last_push_at, last_pull_at,
                           business_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${plataforma}, ${modelo}, ${TS(lastPush)}, ${TS(lastPush)},
              ${BIZ}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [id, source, severity, title, body, cta, href] of NOTICES) {
    await sql`
      INSERT INTO notices (id, source, severity, title, body, cta_label, cta_href, state,
                           business_id, created_at, updated_at)
      VALUES (${id}, ${source}, ${severity}, ${title}, ${body}, ${cta}, ${href}, 'nuevo',
              ${BIZ}, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
  for (const [id, table, rowId, code, preview] of REJECTIONS) {
    await sql`
      INSERT INTO sync_rejections (id, device_id, table_name, row_id, code, payload, received_at,
                                   business_id, created_at, updated_at)
      VALUES (${id}, ${REJECTING_DEVICE}, ${table}, ${rowId}, ${code},
              ${JSON.stringify({ preview })}, ${now}, ${BIZ}, ${now}, ${now})
      ON CONFLICT (id) DO NOTHING`;
  }
}

async function main(): Promise<void> {
  const sql = postgres(URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    await seedBusiness(sql);
    await seedProducts(sql);
    await seedSales(sql);
    await seedExpenses(sql);
    await seedMovements(sql);
    await seedDayClose(sql);
    await seedPeople(sql);
    await seedPortal(sql);

    const [{ count }] = await sql<{ count: string }[]>`SELECT count(*)::text FROM sales`;
    console.log(
      `seeded Taquería Don Pedro — ${count} ventas, ${PRODUCTS.length} productos, ` +
        `${USERS.length} operadores, ${EMPLOYEES.length} empleados, ${DEVICES.length} dispositivos, ` +
        `${NOTICES.length} avisos, ${REJECTIONS.length} rechazos`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
