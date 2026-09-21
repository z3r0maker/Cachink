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
import { seedClients } from './seed-clients.js';
import { seedDayClose, seedMovements } from './seed-extra.js';
import { hash } from 'bcryptjs';
import postgres from 'postgres';

import {
  BIZ,
  CONFORMANCE,
  COST,
  CREATED,
  DEV,
  DEVICES,
  OWNER,
  OPERADOR,
  VIEWER,
  EMPLOYEES,
  EXPENSES,
  movementIdFor,
  NOTICES,
  PRODUCTS,
  REJECTING_DEVICE,
  REJECTIONS,
  SALES,
  TODAY,
  TS,
  USERS,
} from './seed-data';

const URL = process.env.DATABASE_URL;
if (URL === undefined) {
  console.error('DATABASE_URL is required. Try: pnpm db:up');
  process.exit(1);
}

type Sql = ReturnType<typeof postgres>;

async function seedBusiness(sql: Sql): Promise<void> {
  await sql`
    INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
    VALUES (${BIZ}, 'Taquería Don Pedro', 'RESICO', '626', 125, ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
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
  let folio = 0;
  for (const [id, fecha, concepto, productoId, cantidad, monto, metodo] of SALES) {
    folio += 1;
    // C-17 (ADR-073): the header lives in tickets; sales is the line.
    await sql`
      INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
                           business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${folio}, ${fecha}, ${concepto}, ${metodo}, 'pagado',
              ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
    await sql`
      INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                         producto_id, cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${id}, ${fecha}, ${concepto}, 'Producto', ${monto},
              ${productoId}, ${cantidad}, ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
      ON CONFLICT (id) DO NOTHING`;
    await saleMovement(sql, id, fecha, productoId, cantidad);
  }
}

async function saleMovement(
  sql: Sql,
  id: string,
  fecha: string,
  productoId: string,
  cantidad: number,
): Promise<void> {
  await sql`
    INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad,
                                     costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
    VALUES (${movementIdFor(id)}, ${productoId}, ${fecha}, 'salida', ${cantidad},
            ${COST[productoId] ?? 0}, 'Venta', ${BIZ}, ${DEV}, ${TS(fecha)}, ${TS(fecha)})
    ON CONFLICT (id) DO NOTHING`;
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

async function seedPeople(sql: Sql): Promise<void> {
  // A real hash of a documented PIN (ADR-072: four digits, owner-reset only):
  // a register linked to the demo tenant authenticates with 2580. The old
  // constant was a truncated bcrypt string no compare() could ever match.
  const PIN = await hash('2580', 10);
  for (const [id, nombre, color, puedeCancelar] of USERS) {
    await sql`
      INSERT INTO users (id, nombre, pin_hash, avatar_color, permissions, active,
                         business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${nombre}, ${PIN}, ${color},
              ${JSON.stringify({ canCancelSales: puedeCancelar })}, true,
              ${BIZ}, ${DEV}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
  await seedClients(sql);
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

/**
 * Portal members: an identity in `auth.users` plus a row in
 * `business_members` giving it a role on this business.
 *
 * Three of them, because role gating needs something real to gate: an owner
 * who may write, an admin who works but hits the owner-only gates, and a
 * viewer who may not. Passwords are bcrypt at cost 10, the same
 * as GoTrue, so the login check is identical against either issuer.
 */
async function seedMembers(sql: Sql): Promise<void> {
  for (const m of [OWNER, OPERADOR, VIEWER]) {
    const encrypted = await hash(m.password, 10);
    // Hosted Supabase does not let the app role write `auth.users` (B-01):
    // identities go through the security-definer `xangarro.account_create`,
    // which carries the nombre (raw_user_meta_data hosted, a column locally).
    // Its "address taken" false doubles as this seed's re-run case, so the
    // member row decides: ON CONFLICT absorbs our own prior row, while an
    // address owned by a real account fails the member insert's FK loudly.
    await sql`SELECT xangarro.account_create(${m.id}::uuid, ${m.email}, ${encrypted}, ${m.nombre}, ${CREATED})`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${m.memberId}, ${m.id}, ${m.role}, ${BIZ}, ${CREATED}, ${CREATED})
      ON CONFLICT (id) DO NOTHING`;
  }
}

/** See `CONFORMANCE` in seed-data.ts: an isolated tenant with free device slots. */
async function seedConformance(sql: Sql): Promise<void> {
  const c = CONFORMANCE;
  await sql`SELECT set_config('xangarro.business_id', ${c.businessId}, false)`;
  await sql`
    INSERT INTO businesses (id, nombre, regimen_fiscal, regimen_sat, isr_tasa, business_id, device_id, created_at, updated_at)
    VALUES (${c.businessId}, 'Conformance', 'RESICO', '626', 125, ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  await sql`
    INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad, umbral_stock_bajo, tipo,
                          seguir_stock, precio_venta_centavos, business_id, device_id, created_at, updated_at)
    VALUES (${c.productId}, 'Producto de prueba', 'CNF-001', 'Producto Terminado', 100, 'pza', 3, 'producto',
            true, 200, ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  const pin = await hash('0000', 10);
  await sql`
    INSERT INTO users (id, nombre, pin_hash, avatar_color, permissions, active,
                       business_id, device_id, created_at, updated_at)
    VALUES (${c.userId}, 'Operador de prueba', ${pin}, '#3B6FFF', '{}', true,
            ${c.businessId}, ${DEV}, ${CREATED}, ${CREATED})
    ON CONFLICT (id) DO NOTHING`;
  await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
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
    await seedMembers(sql);
    await seedConformance(sql);

    const [{ count }] = await sql<{ count: string }[]>`SELECT count(*)::text FROM sales`;
    console.log(
      `seeded Taquería Don Pedro — ${count} ventas, ${PRODUCTS.length} productos, ` +
        `${USERS.length} operadores, ${EMPLOYEES.length} empleados, ${DEVICES.length} dispositivos, ` +
        `${NOTICES.length} avisos, ${REJECTIONS.length} rechazos, 3 miembros`,
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
