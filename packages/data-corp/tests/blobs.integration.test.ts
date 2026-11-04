import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, it } from 'vitest';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createPgBlobStore, documentosEnAlmacen, marcarAlmacen } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { borrarLoDe } from './cleanup';

/**
 * The Postgres `BlobStore` (E-26): bytes come back as written, a key is
 * written once, and the 4 MB limit holds in the database too.
 */
const { url, describe } = integrationSuite();
const PREFIJO = `test-blobs-${randomBytes(4).toString('hex')}`;
const AUTOR = 'f-blobs-test';
const code = (error: unknown) => (error as { cause?: { code?: string } }).cause?.code;

describe('corp blob store (Postgres)', () => {
  const store = () => createPgBlobStore(createCorpDb(url as string));

  afterAll(async () => {
    const superUrl = process.env.DATABASE_SUPER_URL;
    if (superUrl === undefined || superUrl === '') return;
    const sql = postgres(superUrl, { max: 1, onnotice: () => {} });
    await sql`DELETE FROM corp.blobs WHERE key LIKE ${`${PREFIJO}%`}`;
    await sql.end({ timeout: 5 });
    await borrarLoDe(AUTOR);
  });

  it('gives back the bytes it kept, and nothing for an unknown key', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.7 constancia');
    await store().guardar(`${PREFIJO}-a`, bytes, 'application/pdf');
    assert.deepEqual(await store().leer(`${PREFIJO}-a`), bytes);
    assert.equal(await store().leer(`${PREFIJO}-nadie`), null);
  });

  it('refuses a second write under the same key', async () => {
    await store().guardar(`${PREFIJO}-b`, new Uint8Array([1]), 'application/pdf');
    await assert.rejects(
      store().guardar(`${PREFIJO}-b`, new Uint8Array([2]), 'application/pdf'),
      (e: unknown) => code(e) === '23505',
    );
    assert.deepEqual(await store().leer(`${PREFIJO}-b`), new Uint8Array([1]));
  });

  it('refuses an empty file and one over 4 MB', async () => {
    await assert.rejects(
      store().guardar(`${PREFIJO}-c`, new Uint8Array(0), 'application/pdf'),
      (e: unknown) => code(e) === '23514',
    );
    await assert.rejects(
      store().guardar(`${PREFIJO}-d`, new Uint8Array(4 * 1024 * 1024 + 1), 'application/pdf'),
      (e: unknown) => code(e) === '23514',
    );
  });

  it('says what it is and how much it takes', () => {
    assert.deepEqual([store().almacen, store().maxBytes], ['pg', 4 * 1024 * 1024]);
  });

  it('lists what is still in Postgres, and only the owner may point a row at Azure', async () => {
    const db = createCorpDb(url as string);
    const doc = await createDocumentRepository(db, store()).guardar({
      tipo: 'otro',
      carpeta: 'constitucion',
      titulo: 'Acta para mover',
      periodo: null,
      nombre: 'acta.pdf',
      mime: 'application/pdf',
      contenido: new TextEncoder().encode('%PDF mover'),
      sha256: 'd'.repeat(64),
      obligacionId: null,
      entryId: null,
      reemplazaA: null,
      retenerHasta: '2031-10-08',
      subidoPor: AUTOR,
    });
    const pendiente = (await documentosEnAlmacen(db, 'pg')).find((d) => d.id === doc.id);
    assert.deepEqual(pendiente, {
      id: doc.id,
      blobKey: doc.id,
      sha256: 'd'.repeat(64),
      mime: 'application/pdf',
    });
    await assert.rejects(
      marcarAlmacen(db, doc.id, 'pg', 'azure'),
      (e: unknown) => code(e) === '42501',
    );

    const owner = createCorpDb(process.env.DATABASE_SUPER_URL as string);
    await marcarAlmacen(owner, doc.id, 'pg', 'azure');
    assert.ok(!(await documentosEnAlmacen(db, 'pg')).some((d) => d.id === doc.id));
    assert.ok((await documentosEnAlmacen(db, 'azure')).some((d) => d.id === doc.id));
  });
});
