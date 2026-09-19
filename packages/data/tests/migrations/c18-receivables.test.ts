import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

import { migrationSqlByTag } from '../../drizzle/migrations/index.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

/**
 * Old → new for 0004 (CLAUDE.md §2.9): an abono moves from its sale to the
 * sale's client, the review columns default to `aprobado`, and the triggers
 * survive the client_payments rebuild.
 */
const apply = (db: Database.Database, tag: string) => {
  for (const stmt of splitStatements(migrationSqlByTag[tag] ?? '')) db.exec(stmt);
};

const TS = '2026-01-01T00:00:00.000Z';

function seedOld(db: Database.Database): void {
  db.exec(`
    INSERT INTO clients (id, nombre, telefono, email, nota, business_id, device_id, created_at, updated_at)
    VALUES ('CLI1', 'Chuy', NULL, NULL, NULL, 'B1', 'D1', '${TS}', '${TS}');
  `);
  const sale = db.prepare(
    `INSERT INTO sales (id, fecha, hora, concepto, categoria, monto_centavos, metodo, cliente_id, estado_pago,
       producto_id, cantidad, business_id, device_id, created_at, updated_at)
     VALUES (?, '2026-05-01', NULL, 'Fiado', 'Producto', 8000, 'Crédito', ?, 'pendiente', 'PRD1', 1,
       'B1', 'D1', '${TS}', '${TS}')`,
  );
  sale.run('V1', 'CLI1'); // fiado with a client
  sale.run('V2', null); // sale without a client

  const pago = db.prepare(
    `INSERT INTO client_payments (id, venta_id, fecha, monto_centavos, metodo, nota,
       business_id, device_id, created_at, updated_at)
     VALUES (?, ?, '2026-05-02', 4000, 'Efectivo', NULL, 'B1', 'D1', '${TS}', '${TS}')`,
  );
  pago.run('P1', 'V1'); // lands on CLI1
  pago.run('P2', 'V2'); // its sale has no client: dropped (pre-launch, documented)
}

describe('migration 0004 — receivables and review status', () => {
  it('moves each abono to its sale’s client and drops the rest', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of [
      '0000_initial',
      '0001_add_business_fiscal',
      '0002_add_business_regimen_sat',
      '0003_mensajes_respuestas_operador',
    ])
      apply(db, tag);
    seedOld(db);

    apply(db, '0004_c18_receivables_expected_cash');

    const columns = db.prepare('PRAGMA table_info(client_payments)').all() as { name: string }[];
    assert.ok(
      columns.some((c) => c.name === 'cliente_id'),
      'cliente_id exists',
    );
    assert.ok(!columns.some((c) => c.name === 'venta_id'), 'venta_id is gone');

    const rows = db.prepare('SELECT id, cliente_id FROM client_payments ORDER BY id').all() as {
      id: string;
      cliente_id: string;
    }[];
    assert.deepEqual(rows, [{ id: 'P1', cliente_id: 'CLI1' }], 'P2 had no client to keep');
  });

  it('keeps the change-log trigger working over the rebuilt table', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of [
      '0000_initial',
      '0001_add_business_fiscal',
      '0002_add_business_regimen_sat',
      '0003_mensajes_respuestas_operador',
      '0004_c18_receivables_expected_cash',
    ])
      apply(db, tag);

    db.exec(
      `INSERT INTO client_payments (id, cliente_id, fecha, monto_centavos, metodo, nota,
         business_id, device_id, created_at, updated_at)
       VALUES ('P9', 'CLI1', '2026-05-03', 1000, 'Efectivo', NULL, 'B1', 'D1', '${TS}', '${TS}')`,
    );
    const log = db
      .prepare(`SELECT table_name, row_id, op FROM __cachink_change_log WHERE row_id = 'P9'`)
      .all() as { table_name: string; op: string }[];
    assert.equal(log[0]?.table_name, 'client_payments');
    assert.equal(log[0]?.op, 'insert');
  });

  it('defaults the review columns to aprobado and adds the C-18 columns', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = OFF');
    for (const tag of [
      '0000_initial',
      '0001_add_business_fiscal',
      '0002_add_business_regimen_sat',
      '0003_mensajes_respuestas_operador',
      '0004_c18_receivables_expected_cash',
    ])
      apply(db, tag);
    db.exec(
      `INSERT INTO clients (id, nombre, telefono, email, nota, business_id, device_id, created_at, updated_at)
       VALUES ('CLI2', 'Raúl', NULL, NULL, NULL, 'B1', 'D1', '${TS}', '${TS}')`,
    );
    db.exec(
      `INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, proveedor,
         business_id, device_id, created_at, updated_at)
       VALUES ('E1', '2026-05-01', 'Gas', 'Servicios', 3000, NULL, 'B1', 'D1', '${TS}', '${TS}')`,
    );

    const client = db
      .prepare(
        'SELECT estado_revision, limite_centavos, plazo_dias, fusionado_con_id FROM clients WHERE id = ?',
      )
      .get('CLI2') as Record<string, unknown>;
    assert.equal(client['estado_revision'], 'aprobado');
    assert.equal(client['limite_centavos'], null);
    assert.equal(client['plazo_dias'], null);
    assert.equal(client['fusionado_con_id'], null);

    const product = db.prepare('SELECT estado_revision FROM products LIMIT 1').get() as
      | Record<string, unknown>
      | undefined;
    if (product) assert.equal(product['estado_revision'], 'aprobado');

    const expense = db
      .prepare('SELECT caja_turno_id FROM expenses WHERE id = ?')
      .get('E1') as Record<string, unknown>;
    assert.equal(expense['caja_turno_id'], null);

    const turnoCols = db.prepare('PRAGMA table_info(caja_turnos)').all() as { name: string }[];
    assert.ok(turnoCols.some((c) => c.name === 'denominaciones'));
  });
});
