import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0012 (E-13, ADR-148), old → new (CLAUDE.md §2.9): the Agenda's ISR and IVA
 * rows become one «ISR e IVA» per month. A month with both keeps the ISR row,
 * the IVA row's documents and the less advanced status; a month with one is
 * renamed. Run on a throwaway database migrated up to 0011.
 */
const { describe } = integrationSuite();

describe('0012: ISR e IVA, one obligation a month', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;

  const obligacion = (id: string, plantilla: string, periodo: string, estado: string) => sql`
    INSERT INTO corp.obligations (id, template_id, period, status, created_by, created_at,
                                  updated_by, updated_at)
    VALUES (${id}, ${plantilla}, ${periodo}, ${estado}, 'f1', now(), 'f1', now())`;

  const documento = (id: string, obligacion: string) => sql`
    INSERT INTO corp.documents (id, kind, folder, title, period, filename, mime, size_bytes,
                                sha256, storage, blob_key, obligation_id, retain_until,
                                uploaded_by, uploaded_at)
    VALUES (${id}, 'acuse', 'sat', 'Acuse', '2026-09', 'acuse.pdf', 'application/pdf', 10,
            ${'a'.repeat(64)}, 'pg', ${id}, ${obligacion}, '2031-10-08', 'f1', now())`;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0012');
    await obligacion('isr-sep', 'isr_mensual', '2026-09', 'pagada');
    await obligacion('iva-sep', 'iva_mensual', '2026-09', 'presentada');
    await documento('doc-iva-sep', 'iva-sep');
    await obligacion('iva-oct', 'iva_mensual', '2026-10', 'preparada');
    await obligacion('csd-1', 'csd', '2026-11-18', 'pendiente');
    await base.aplicar((f) => f >= '0012');
  });

  afterAll(() => base?.cerrar());

  const fila = async (id: string) => {
    const [r] = await sql<{ template_id: string; status: string }[]>`
      SELECT template_id, status FROM corp.obligations WHERE id = ${id}`;
    return r;
  };

  it('keeps one row for a month that had both, at the less advanced status', async () => {
    assert.deepEqual(await fila('isr-sep'), {
      template_id: 'impuestos_mensual',
      status: 'presentada',
    });
    assert.equal(await fila('iva-sep'), undefined);
  });

  it("moves the IVA row's documents to the one that stays", async () => {
    const [d] = await sql<{ obligation_id: string }[]>`
      SELECT obligation_id FROM corp.documents WHERE id = 'doc-iva-sep'`;
    assert.equal(d?.obligation_id, 'isr-sep');
  });

  it('renames a month that had only one, and leaves other obligations alone', async () => {
    assert.deepEqual(await fila('iva-oct'), {
      template_id: 'impuestos_mensual',
      status: 'preparada',
    });
    assert.equal((await fila('csd-1'))?.template_id, 'csd');
    const viejas = await sql`
      SELECT 1 FROM corp.obligations WHERE template_id IN ('isr_mensual', 'iva_mensual')`;
    assert.equal(viejas.length, 0);
  });

  it('lets the console write declarations, never delete them', async () => {
    const grants = await sql<{ privilege_type: string }[]>`
      SELECT privilege_type FROM information_schema.role_table_grants
       WHERE grantee = 'xangarro_corp' AND table_schema = 'corp' AND table_name = 'tax_returns'
       ORDER BY privilege_type`;
    assert.deepEqual(
      grants.map((g) => g.privilege_type),
      ['INSERT', 'SELECT', 'UPDATE'],
    );
  });
});
