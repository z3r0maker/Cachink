import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

/**
 * Old → new for 0005 (CLAUDE.md §2.9): every sale becomes a one-line
 * ticket — the header facts move up, the line keeps product/quantity/
 * amount, folios number per device in creation order, and the ticket's
 * change is derived where cash tendered is known.
 */
const apply = (db: Database.Database, tag: string) => {
  for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
};

const THROUGH_0004 = [
  '0000_initial',
  '0001_add_business_fiscal',
  '0002_add_business_regimen_sat',
  '0003_mensajes_respuestas_operador',
  '0004_c18_receivables_expected_cash',
] as const;

const TS = '2026-01-01T00:00:00.000Z';

function seedOld(db: Database.Database): void {
  db.exec(`
    INSERT INTO clients (id, nombre, telefono, email, nota, business_id, device_id, created_at, updated_at)
    VALUES ('CLI1', 'Chuy', NULL, NULL, NULL, 'B1', 'D1', '${TS}', '${TS}');
  `);
  const sale = db.prepare(
    `INSERT INTO sales (id, fecha, hora, concepto, categoria, monto_centavos, metodo, cliente_id,
       estado_pago, producto_id, cantidad, efectivo_recibido_centavos, caja_turno_id,
       business_id, device_id, created_at, updated_at)
     VALUES (?, '2026-05-01', '13:45', ?, 'Producto', ?, 'Crédito', 'CLI1', 'pendiente', 'PRD1', ?, NULL, NULL,
       'B1', ?, ?, ?)`,
  );
  sale.run(
    'S1',
    'Taco crédito',
    8000,
    2,
    'D1',
    '2026-05-01T13:45:00.000Z',
    '2026-05-01T13:45:00.000Z',
  );
  const cash = db.prepare(
    `INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, cliente_id,
       estado_pago, producto_id, cantidad, efectivo_recibido_centavos,
       business_id, device_id, created_at, updated_at)
     VALUES (?, '2026-05-01', ?, 'Producto', ?, 'Efectivo', NULL, 'pagado', 'PRD1', 1, 5000,
       'B1', ?, ?, ?)`,
  );
  cash.run(
    'S2',
    'Taco efectivo',
    4500,
    'D2',
    '2026-05-01T13:50:00.000Z',
    '2026-05-01T13:50:00.000Z',
  );
}

describe('migration 0005 — tickets and lines', () => {
  it('moves each sale into a one-line ticket and strips the header columns', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of THROUGH_0004) apply(db, tag);
    seedOld(db);

    apply(db, '0005_c17_tickets_sales_lines');

    const ticket = db
      .prepare('SELECT id, folio, metodo, cliente_id, estado_pago FROM tickets WHERE id = ?')
      .get('S1') as Record<string, unknown>;
    assert.equal(ticket['metodo'], 'Crédito');
    assert.equal(ticket['cliente_id'], 'CLI1');
    assert.equal(ticket['estado_pago'], 'pendiente');

    const line = db
      .prepare('SELECT ticket_id, producto_id, cantidad, monto_centavos FROM sales WHERE id = ?')
      .get('S1') as Record<string, unknown>;
    assert.equal(line['ticket_id'], 'S1');
    assert.equal(line['producto_id'], 'PRD1');
    assert.equal(line['cantidad'], 2);
    assert.equal(line['monto_centavos'], 8000);

    const columns = db.prepare('PRAGMA table_info(sales)').all() as { name: string }[];
    for (const gone of [
      'metodo',
      'cliente_id',
      'estado_pago',
      'efectivo_recibido_centavos',
      'caja_turno_id',
    ])
      assert.ok(!columns.some((c) => c.name === gone), `${gone} left sales`);
    assert.ok(columns.some((c) => c.name === 'ticket_id'));
  });

  it('numbers folios per device, in creation order', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of THROUGH_0004) apply(db, tag);
    seedOld(db);
    apply(db, '0005_c17_tickets_sales_lines');

    const d1 = db.prepare('SELECT folio FROM tickets WHERE id = ?').get('S1') as { folio: number };
    const d2 = db.prepare('SELECT folio FROM tickets WHERE id = ?').get('S2') as { folio: number };
    assert.equal(d1.folio, 1);
    assert.equal(d2.folio, 1, 'each device numbers its own folios');
  });

  it('moves cancelacion_logs onto tickets', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of THROUGH_0004) apply(db, tag);
    db.exec(
      `INSERT INTO cancelacion_logs (id, sale_id, cancelled_by_user_id, motivo,
         monto_original_centavos, metodo_original, business_id, device_id, created_at, updated_at)
       VALUES ('CG1', 'S1', '01HZ8XQN9GZJXV8AKQ5X0C7TUS', 'Cliente cambió de opinión',
         8000, 'Crédito', 'B1', 'D1', '${TS}', '${TS}')`,
    );
    apply(db, '0005_c17_tickets_sales_lines');
    const row = db
      .prepare('SELECT ticket_id FROM cancelacion_logs WHERE id = ?')
      .get('CG1') as Record<string, unknown>;
    assert.equal(row['ticket_id'], 'S1');
    const columns = db.prepare('PRAGMA table_info(cancelacion_logs)').all() as { name: string }[];
    assert.ok(!columns.some((c) => c.name === 'sale_id'));
  });

  it('keeps the change-log triggers working for both tables', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of THROUGH_0004) apply(db, tag);
    apply(db, '0005_c17_tickets_sales_lines');

    db.exec(
      `INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago,
         business_id, device_id, created_at, updated_at)
       VALUES ('T9', 9, '2026-05-02', 'Mostrador', 'Efectivo', 'pagado', 'B1', 'D1', '${TS}', '${TS}')`,
    );
    db.exec(
      `INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
         producto_id, cantidad, business_id, device_id, created_at, updated_at)
       VALUES ('L9', 'T9', '2026-05-02', 'Taco', 'Producto', 2500, 'PRD1', 1, 'B1', 'D1', '${TS}', '${TS}')`,
    );
    const log = db
      .prepare(
        `SELECT table_name FROM __cachink_change_log WHERE row_id IN ('T9','L9') ORDER BY row_id`,
      )
      .all() as { table_name: string }[];
    assert.deepEqual(log.map((l) => l.table_name).sort(), ['sales', 'tickets']);
  });
});
