import { expect, test } from '@playwright/test';
import { deviceHeaders } from '@xangarro/contracts';
import { newUlid } from '@xangarro/domain';

import {
  activatePhone,
  asTenant,
  BIZ,
  client,
  CNF,
  CNF_PRODUCT,
  pull,
  push,
  sale,
  TACO,
  type Phone,
} from './sync-phone';

/**
 * Two phones and the portal on one business (B-08, B-09), through HTTP and the
 * screen. The contract's conformance suite proves the endpoint shapes; this
 * proves the round trips between surfaces, the cross-tenant conflict (audit
 * DB-SYNC-05), and paging a backlog without skipping (DB-SYNC-04).
 */
test.describe.configure({ mode: 'serial' });

let a: Phone;
let b: Phone;

test.beforeAll(async ({ request }) => {
  // This project runs after every viewport, so Taquería's slots are free to take.
  await asTenant(BIZ, (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`);
  a = await activatePhone(request, 'SYNCAAA2');
  b = await activatePhone(request, 'SYNCBBB2');
});

test('a push is stored with its money, acknowledged, and its bad row shows on Sincronización', async ({
  page,
  request,
}) => {
  const good = sale(a);
  const bad = sale(a, { productoId: newUlid(), concepto: 'Venta sin producto' });
  const r = await (await push(request, a, [good, bad])).json();
  expect(r.accepted.map((x: { rowId: string }) => x.rowId)).toEqual([good.rowId]);
  expect(r.rejected[0].code).toBe('FK_PRODUCT_MISSING');

  const [stored] = await asTenant(
    BIZ,
    (sql) => sql`SELECT monto_centavos::text AS m FROM sales WHERE id = ${good.rowId}`,
  );
  expect(stored?.m).toBe('4500');
  expect((await pull(request, a, a.cursor)).acknowledgedThrough).toBeGreaterThanOrEqual(
    r.accepted[0].serverSeq,
  );

  await page.goto('/sincronizacion');
  await expect(page.locator('main').getByText('Venta · Venta sin producto')).toBeVisible();
});

test('a client added on one phone reaches the other', async ({ request }) => {
  const c = client(a, `Cliente E2E ${Date.now()}`);
  expect((await (await push(request, a, [c])).json()).accepted).toHaveLength(1);
  const got = await pull(request, b, b.cursor);
  expect(got.tables.clients.map((x: { id: string }) => x.id)).toContain(c.rowId);
});

test('a portal edit reaches the next pull, and only it', async ({ page, request }) => {
  const cursor = (await pull(request, b, b.cursor)).serverSeq;
  const renamed = `Taco al pastor ${Date.now()}`;
  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: 'TAC-001' })
    .getByRole('button', { name: 'Editar' })
    .click();
  await page.getByTestId('edit-producto-nombre').fill(renamed);
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText(renamed)).toBeVisible();

  const got = await pull(request, b, cursor);
  expect(got.tables.products.map((p: { nombre: string }) => p.nombre)).toEqual([renamed]);
  expect(got.tables.users).toEqual([]);
});

test('switching a feature off in Negocio reaches the phone on its next pull', async ({
  page,
  request,
}) => {
  const cursor = (await pull(request, b, b.cursor)).serverSeq;
  await page.goto('/negocio');
  await page.getByRole('switch', { name: 'Inventario / Stock' }).click();
  await expect(page.getByRole('switch', { name: 'Inventario / Stock' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
  const got = await pull(request, b, cursor);
  expect(got.tables.feature_flags).toMatchObject({ stock: false });
  expect(JSON.parse(got.tables.businesses[0].featureFlags)).toMatchObject({ stock: false });
});

test('an id owned by another business is a conflict, and that business is untouched', async ({
  request,
}) => {
  const foreignSale = newUlid();
  await asTenant(
    CNF,
    (sql) => sql`
      INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago,
                         producto_id, cantidad, business_id, device_id, created_at, updated_at)
      VALUES (${foreignSale}, '2026-09-17', 'De otro negocio', 'Producto', 100, 'Efectivo',
              'pagado', ${CNF_PRODUCT}, 1, ${CNF}, 'cnf-device',
              now() - interval '1 day', now() - interval '1 day')`,
  );
  // Both write paths: an UP upsert (DO UPDATE → RLS 42501) and a HYBRID
  // insert (DO NOTHING → invisible row), each on the other tenant's id.
  const [template] = (await pull(request, a, 0)).tables.products;
  const product = {
    table: 'products',
    rowId: CNF_PRODUCT,
    op: 'insert',
    clientSeq: 2,
    row: { ...template, id: CNF_PRODUCT, deviceId: a.deviceId },
  };
  const r = await (await push(request, a, [sale(a, { id: foreignSale }), product])).json();
  expect(r.rejected.map((x: { code: string }) => x.code)).toEqual([
    'DUPLICATE_CONFLICT',
    'DUPLICATE_CONFLICT',
  ]);

  const [row] = await asTenant(
    CNF,
    (sql) => sql`SELECT concepto FROM sales WHERE id = ${foreignSale}`,
  );
  expect(row?.concepto).toBe('De otro negocio');
});

test('a backlog longer than a page arrives in order, without skipping', async ({ request }) => {
  const from = (await pull(request, b, b.cursor)).serverSeq;
  const backlog = 5_050;
  await asTenant(
    BIZ,
    (sql) => sql`
    WITH c AS (UPDATE sync_cursors SET last_seq = last_seq + ${backlog} RETURNING last_seq)
    INSERT INTO sync_log (seq, table_name, row_id, op, business_id, created_at, updated_at)
    SELECT s, 'products', '01HZ8XQN9GZJXV8AKQ5X0PTAC1', 'update', ${BIZ}, now(), now()
    FROM c, generate_series(c.last_seq - ${backlog} + 1, c.last_seq) AS s`,
  );

  const first = await pull(request, b, from);
  expect(first.serverSeq).toBe(from + 5_000);
  expect(first.tables.products).toHaveLength(1);
  const second = await pull(request, b, first.serverSeq);
  expect(second.serverSeq).toBe(from + backlog);
});

test('retention: a phone may purge exactly what the cloud stored, and only its own', async ({
  request,
}) => {
  const bAck = (await pull(request, b, b.cursor)).acknowledgedThrough;
  const bad = sale(a, { productoId: newUlid() });
  const first = await (await push(request, a, [sale(a), bad])).json();
  const second = await (await push(request, a, [sale(a)])).json();
  const stored = [...first.accepted, ...second.accepted].map(
    (x: { serverSeq: number }) => x.serverSeq,
  );

  expect((await pull(request, a, a.cursor)).acknowledgedThrough).toBeGreaterThanOrEqual(
    Math.max(...stored),
  );
  // A rejected row gets no serverSeq, so no acknowledgedThrough can ever cover it…
  expect(first.rejected[0].rowId).toBe(bad.rowId);
  const receipts = await asTenant(
    BIZ,
    (sql) => sql`SELECT 1 FROM sync_receipts WHERE row_id = ${bad.rowId}`,
  );
  expect(receipts).toHaveLength(0);
  // …and another phone's bound does not move for pushes that are not its own.
  expect((await pull(request, b, b.cursor)).acknowledgedThrough).toBe(bAck);

  // Fixed and re-pushed, it is stored — and only now covered.
  const fixed = await (
    await push(request, a, [{ ...bad, row: { ...bad.row, productoId: TACO } }])
  ).json();
  expect((await pull(request, a, a.cursor)).acknowledgedThrough).toBeGreaterThanOrEqual(
    fixed.accepted[0].serverSeq,
  );
});

test('a phone over 60 calls a minute is told when to come back', async ({ request }) => {
  let limited = null;
  for (let i = 0; i < 70 && limited === null; i += 1) {
    const r = await request.get('/api/v1/entitlement', { headers: deviceHeaders(b.token) });
    if (r.status() === 429) limited = r;
  }
  expect(limited, 'no 429 within 70 calls').not.toBeNull();
  expect(Number(limited?.headers()['retry-after'])).toBeGreaterThan(0);
  expect((await limited?.json()).error.code).toBe('RATE_LIMITED');
});
