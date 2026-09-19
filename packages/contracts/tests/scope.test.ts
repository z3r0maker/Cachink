import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  DOWN_TABLES,
  HYBRID_TABLES,
  NEVER_SYNCED_TABLES,
  UP_TABLES,
  isPullable,
  isPushable,
  isSyncedTable,
} from '../src/scope.js';

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(here, '../../data/src/schema');

/** Every sqliteTable('name') declared in packages/data — the ground truth. */
function localTables(): string[] {
  const names: string[] = [];
  for (const f of readdirSync(SCHEMA_DIR)) {
    if (!f.endsWith('.ts')) continue;
    const src = readFileSync(resolve(SCHEMA_DIR, f), 'utf8');
    for (const m of src.matchAll(/sqliteTable\(\s*'([a-z_]+)'/g)) names.push(m[1] as string);
  }
  return names.sort();
}

describe('table scope', () => {
  it('classifies every local table exactly once', () => {
    const all = [...UP_TABLES, ...HYBRID_TABLES, ...DOWN_TABLES, ...NEVER_SYNCED_TABLES];
    assert.equal(new Set(all).size, all.length, 'a table appears in two lists');
    assert.deepEqual([...all].sort(), localTables());
  });

  it('hybrid tables accept inserts but not updates', () => {
    assert.equal(isPushable('products', 'insert'), true);
    assert.equal(isPushable('products', 'update'), false);
  });

  it('inventory movements flow to every phone: pushed as inserts, never updated, pulled (ADR-081)', () => {
    assert.equal(isPushable('inventory_movements', 'insert'), true);
    assert.equal(isPushable('inventory_movements', 'update'), false);
    assert.equal(isPullable('inventory_movements'), true);
  });

  it('down-only tables are never pushable and up-only tables are never pullable', () => {
    assert.equal(isPushable('users', 'insert'), false);
    assert.equal(isPullable('sales'), false);
    assert.equal(isPullable('products'), true);
  });

  it('unknown tables are outside the scope', () => {
    assert.equal(isSyncedTable('__sync_change_log'), false);
    assert.equal(isPushable('app_config', 'insert'), false);
  });
});
