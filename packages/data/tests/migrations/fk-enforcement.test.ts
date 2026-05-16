/**
 * FK enforcement tests for the hardened schema.
 *
 * Validates that:
 *   1. FK constraints exist in the DDL and are enforced when
 *      PRAGMA foreign_keys = ON (as set in production providers).
 *   2. CHECK constraints reject invalid enum values.
 *   3. UNIQUE constraints prevent duplicates.
 *   4. PRAGMA defer_foreign_keys = ON allows out-of-order inserts
 *      within a transaction (sync pull-loop pattern).
 */

import Database from 'better-sqlite3';
import { describe, expect, it, beforeEach } from 'vitest';
import { migration0000Sql } from '../../drizzle/migrations/0000_initial.js';
import { splitStatements } from '../../src/migrator/split-statements.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7TEN';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7TEP';
const NOW = '2026-05-16T12:00:00.000Z';

function freshDbWithFKs(): Database.Database {
  const sqlite = new Database(':memory:');
  // Enable FK enforcement (matches production providers)
  sqlite.pragma('foreign_keys = ON');
  for (const stmt of splitStatements(migration0000Sql)) {
    sqlite.exec(stmt);
  }
  return sqlite;
}

function insertProduct(sqlite: Database.Database, id: string): void {
  sqlite.exec(`
    INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id, created_at, updated_at)
    VALUES ('${id}', 'Test Product', 'Materia Prima', 1000, 'pza', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
  `);
}

function insertClient(sqlite: Database.Database, id: string): void {
  sqlite.exec(`
    INSERT INTO clients (id, nombre, business_id, device_id, created_at, updated_at)
    VALUES ('${id}', 'Test Client', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
  `);
}

function insertUser(sqlite: Database.Database, id: string): void {
  sqlite.exec(`
    INSERT INTO users (id, nombre, pin_hash, recovery_password_hash, role, business_id, device_id, created_at, updated_at)
    VALUES ('${id}', 'Test User', 'hash123', 'recovery123', 'operativo', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
  `);
}

function insertSale(sqlite: Database.Database, id: string, productoId: string): void {
  sqlite.exec(`
    INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
    VALUES ('${id}', '2026-05-16', 'Test', 'Producto', 5000, 'Efectivo', 'pagado', '${productoId}', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
  `);
}

describe('FK enforcement', () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = freshDbWithFKs();
  });

  it('rejects a sale with non-existent producto_id', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Efectivo', 'pagado', 'NONEXISTENT', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/FOREIGN KEY/i);
  });

  it('accepts a sale with an existing producto_id', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Efectivo', 'pagado', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).not.toThrow();
  });

  it('rejects a client_payment with non-existent venta_id', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO client_payments (id, venta_id, fecha, monto_centavos, metodo, business_id, device_id, created_at, updated_at)
        VALUES ('pay-1', 'NONEXISTENT', '2026-05-16', 1000, 'Efectivo', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/FOREIGN KEY/i);
  });

  it('rejects inventory_movement with non-existent producto_id', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
        VALUES ('mov-1', 'NONEXISTENT', '2026-05-16', 'entrada', 10, 500, 'Compra', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/FOREIGN KEY/i);
  });

  it('rejects caja_turnos with non-existent user_id', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos, efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
        VALUES ('turno-1', 'NONEXISTENT', '2026-05-16', '${NOW}', 50000, 0, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/FOREIGN KEY/i);
  });

  it('rejects entregas_credito with non-existent cliente_id', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO entregas_credito (id, cliente_id, fecha, total_centavos, sale_ids, business_id, device_id, created_at, updated_at)
        VALUES ('entrega-1', 'NONEXISTENT', '2026-05-16', 10000, '[]', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/FOREIGN KEY/i);
  });

  it('allows nullable FK (sale.cliente_id = NULL)', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, cliente_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Walk-in', 'Producto', 5000, 'Efectivo', 'pagado', 'prod-1', NULL, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).not.toThrow();
  });
});

describe('defer_foreign_keys allows out-of-order inserts in transactions', () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = freshDbWithFKs();
  });

  it('inserts child before parent within a deferred-FK transaction', () => {
    expect(() => {
      sqlite.exec('BEGIN');
      sqlite.exec('PRAGMA defer_foreign_keys = ON');
      // Insert sale BEFORE the product it references
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Efectivo', 'pagado', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
      // Now insert the referenced product
      sqlite.exec(`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id, created_at, updated_at)
        VALUES ('prod-1', 'Harina', 'Materia Prima', 3500, 'kg', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
      sqlite.exec('COMMIT');
    }).not.toThrow();
  });

  it('still rejects if deferred FK is never satisfied at commit', () => {
    expect(() => {
      sqlite.exec('BEGIN');
      sqlite.exec('PRAGMA defer_foreign_keys = ON');
      // Insert sale referencing non-existent product, never create the product
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Efectivo', 'pagado', 'NEVER_CREATED', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
      sqlite.exec('COMMIT');
    }).toThrow(/FOREIGN KEY/i);
  });
});

describe('CHECK constraints', () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = freshDbWithFKs();
  });

  it('rejects invalid sale.categoria', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'INVALID_CATEGORY', 5000, 'Efectivo', 'pagado', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid sale.metodo', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Bitcoin', 'pagado', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid sale.estado_pago', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
        VALUES ('sale-1', '2026-05-16', 'Taco', 'Producto', 5000, 'Efectivo', 'cancelled', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid product.unidad', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id, created_at, updated_at)
        VALUES ('prod-1', 'Thing', 'Materia Prima', 1000, 'galones', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid product.tipo', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, tipo, business_id, device_id, created_at, updated_at)
        VALUES ('prod-1', 'Thing', 'Materia Prima', 1000, 'pza', 'digital', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid inventory_movements.tipo', () => {
    insertProduct(sqlite, 'prod-1');
    expect(() => {
      sqlite.exec(`
        INSERT INTO inventory_movements (id, producto_id, fecha, tipo, cantidad, costo_unit_centavos, motivo, business_id, device_id, created_at, updated_at)
        VALUES ('mov-1', 'prod-1', '2026-05-16', 'transferencia', 10, 500, 'Move', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid employees.periodo', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO employees (id, nombre, puesto, salario_centavos, periodo, business_id, device_id, created_at, updated_at)
        VALUES ('emp-1', 'Juan', 'Cajero', 500000, 'diario', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid users.role', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO users (id, nombre, pin_hash, recovery_password_hash, role, business_id, device_id, created_at, updated_at)
        VALUES ('user-1', 'Ana', 'hash', 'recovery', 'admin', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid businesses.tipo_negocio', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, tipo_negocio, business_id, device_id, created_at, updated_at)
        VALUES ('biz-1', 'Mi Tienda', 'RIF', 3000, 'e-commerce', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid director_alerts.severity', () => {
    expect(() => {
      sqlite.exec(`
        INSERT INTO director_alerts (id, source, severity, title_key, message, business_id, device_id, created_at, updated_at)
        VALUES ('alert-1', 'stock', 'emergency', 'title', 'msg', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('rejects invalid caja_movimientos.tipo', () => {
    insertUser(sqlite, 'user-1');
    // Need expense + caja_turno for FK chain
    sqlite.exec(`
      INSERT INTO expenses (id, fecha, concepto, categoria, monto_centavos, business_id, device_id, created_at, updated_at)
      VALUES ('exp-1', '2026-05-16', 'Test', 'Renta', 5000, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    sqlite.exec(`
      INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos, efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
      VALUES ('turno-1', 'user-1', '2026-05-16', '${NOW}', 50000, 0, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    expect(() => {
      sqlite.exec(`
        INSERT INTO caja_movimientos (id, turno_id, tipo, monto_centavos, motivo, user_id, business_id, device_id, created_at, updated_at)
        VALUES ('mov-1', 'turno-1', 'ajuste', 5000, 'test', 'user-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/CHECK/i);
  });

  it('accepts all valid enum values for sale.metodo', () => {
    insertProduct(sqlite, 'prod-1');
    const methods = ['Efectivo', 'Transferencia', 'Tarjeta', 'QR/CoDi', 'Crédito'];
    for (let i = 0; i < methods.length; i++) {
      expect(() => {
        sqlite.exec(`
          INSERT INTO sales (id, fecha, concepto, categoria, monto_centavos, metodo, estado_pago, producto_id, business_id, device_id, created_at, updated_at)
          VALUES ('sale-${i}', '2026-05-16', 'Test', 'Producto', 5000, '${methods[i]}', 'pagado', 'prod-1', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
        `);
      }).not.toThrow();
    }
  });
});

describe('UNIQUE constraints', () => {
  let sqlite: Database.Database;

  beforeEach(() => {
    sqlite = freshDbWithFKs();
  });

  it('rejects duplicate day_closes for same fecha+business+device', () => {
    sqlite.exec(`
      INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos, diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
      VALUES ('dc-1', '2026-05-16', 100000, 100000, 0, 'Operativo', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    expect(() => {
      sqlite.exec(`
        INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos, diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
        VALUES ('dc-2', '2026-05-16', 200000, 200000, 0, 'Director', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/UNIQUE/i);
  });

  it('allows day_closes on same date for different devices', () => {
    sqlite.exec(`
      INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos, diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
      VALUES ('dc-1', '2026-05-16', 100000, 100000, 0, 'Operativo', '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    expect(() => {
      sqlite.exec(`
        INSERT INTO day_closes (id, fecha, efectivo_esperado_centavos, efectivo_contado_centavos, diferencia_centavos, cerrado_por, business_id, device_id, created_at, updated_at)
        VALUES ('dc-2', '2026-05-16', 200000, 200000, 0, 'Director', '${BIZ}', 'OTHER_DEVICE', '${NOW}', '${NOW}')
      `);
    }).not.toThrow();
  });

  it('rejects duplicate conversion_recetas for same materia_prima+resultante+business', () => {
    insertProduct(sqlite, 'mp-1');
    insertProduct(sqlite, 'pr-1');
    sqlite.exec(`
      INSERT INTO conversion_recetas (id, materia_prima_id, producto_resultante_id, cantidad_origen, cantidad_resultante, business_id, device_id, created_at, updated_at)
      VALUES ('receta-1', 'mp-1', 'pr-1', 10, 5, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    expect(() => {
      sqlite.exec(`
        INSERT INTO conversion_recetas (id, materia_prima_id, producto_resultante_id, cantidad_origen, cantidad_resultante, business_id, device_id, created_at, updated_at)
        VALUES ('receta-2', 'mp-1', 'pr-1', 20, 10, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).toThrow(/UNIQUE/i);
  });

  it('allows same materia_prima+resultante for different businesses', () => {
    insertProduct(sqlite, 'mp-1');
    insertProduct(sqlite, 'pr-1');
    sqlite.exec(`
      INSERT INTO conversion_recetas (id, materia_prima_id, producto_resultante_id, cantidad_origen, cantidad_resultante, business_id, device_id, created_at, updated_at)
      VALUES ('receta-1', 'mp-1', 'pr-1', 10, 5, '${BIZ}', '${DEV}', '${NOW}', '${NOW}')
    `);
    expect(() => {
      sqlite.exec(`
        INSERT INTO conversion_recetas (id, materia_prima_id, producto_resultante_id, cantidad_origen, cantidad_resultante, business_id, device_id, created_at, updated_at)
        VALUES ('receta-2', 'mp-1', 'pr-1', 20, 10, 'OTHER_BIZ', '${DEV}', '${NOW}', '${NOW}')
      `);
    }).not.toThrow();
  });
});
