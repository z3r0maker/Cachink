import assert from 'node:assert/strict';
import type postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * 0007 + 0008 (E-26), old → new (CLAUDE.md §2.9): a document filed before the
 * migration keeps its bytes, now in `corp.blobs` under its id, and its row
 * points there. Run on a throwaway database migrated up to 0006, so the
 * suite's own database is never rolled back.
 */
const { describe } = integrationSuite();

describe('0007 + 0008: documents point at their blobs', () => {
  let base: BaseDesechable;
  let sql: postgres.Sql;
  const bytes = Buffer.from('%PDF-1.7 acta de 2026');

  beforeAll(async () => {
    base = await crearBaseDesechable();
    sql = base.sql;
    await base.aplicar((f) => f < '0007');
    await sql`
      INSERT INTO corp.documents (id, kind, folder, title, period, filename, mime, size_bytes,
                                  sha256, content, retain_until, uploaded_by, uploaded_at)
      VALUES ('doc-viejo', 'otro', 'constitucion', 'Acta constitutiva', '2026', 'acta.pdf',
              'application/pdf', ${bytes.byteLength}, ${'a'.repeat(64)}, ${bytes},
              '2031-10-08', 'f1', now())`;
    await base.aplicar((f) => f >= '0007');
  });

  afterAll(() => base?.cerrar());

  it('moves the bytes into corp.blobs under the document id', async () => {
    const [blob] = await sql<{ content: Buffer }[]>`
      SELECT content FROM corp.blobs WHERE key = 'doc-viejo'`;
    assert.deepEqual(blob?.content, bytes);
  });

  it('points the row at the Postgres store and drops the old column', async () => {
    const [doc] = await sql<{ storage: string; blob_key: string; size_bytes: number }[]>`
      SELECT storage, blob_key, size_bytes FROM corp.documents WHERE id = 'doc-viejo'`;
    assert.deepEqual(doc, { storage: 'pg', blob_key: 'doc-viejo', size_bytes: bytes.byteLength });
    const cols = await sql`
      SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'corp' AND table_name = 'documents' AND column_name = 'content'`;
    assert.equal(cols.length, 0);
  });

  it('now refuses a row without a store, and takes a 20 MB file on Azure', async () => {
    const base = sql`
      INSERT INTO corp.documents (id, kind, folder, title, filename, mime, size_bytes, sha256,
                                  storage, blob_key, retain_until, uploaded_by, uploaded_at)`;
    await assert.rejects(
      sql`${base} VALUES ('d2', 'otro', 'sat', 'X', 'x.pdf', 'application/pdf', 1,
                          ${'b'.repeat(64)}, 'nas', 'k2', '2031-10-08', 'f1', now())`,
      /documents_storage_check/,
    );
    await sql`${base} VALUES ('d3', 'otro', 'sat', 'Deck', 'deck.pdf', 'application/pdf',
                              ${20 * 1024 * 1024}, ${'c'.repeat(64)}, 'azure', 'k3',
                              '2031-10-08', 'f1', now())`;
  });

  it('lets the console insert and read blobs, never change them', async () => {
    const grants = await sql<{ privilege_type: string }[]>`
      SELECT privilege_type FROM information_schema.role_table_grants
       WHERE grantee = 'xangarro_corp' AND table_schema = 'corp' AND table_name = 'blobs'
       ORDER BY privilege_type`;
    assert.deepEqual(
      grants.map((g) => g.privilege_type),
      ['INSERT', 'SELECT'],
    );
  });
});
