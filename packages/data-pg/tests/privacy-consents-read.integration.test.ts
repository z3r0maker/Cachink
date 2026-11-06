import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import { sql } from 'drizzle-orm';

import { createDb, type Db } from '../src/client';
import { consentsOfUser, recordPrivacyConsent } from '../src/security';
import { integrationSuite } from './support/db';

/**
 * `0052_privacy_consents_read.sql` (ADR-137): «Privacidad y mis datos» reads
 * the account's latest row per purpose and nobody else's; the ledger stays
 * unreadable to the app role and append-only. Rows the seed never writes (a
 * signup, then a change of mind) are built here.
 */
const { url, describe } = integrationSuite();
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7AAA';
const H = (c: string) => c.repeat(64);

describe('reading your own consents', () => {
  let db: Db;
  const yo = randomUUID();
  const otra = randomUUID();
  const ctx = (userId: string) => ({ userId, businessId: BIZ, ipHash: '', userAgent: 'test' });
  const grant = (o: Record<string, unknown>) => ({
    avisoVersion: '0.2-borrador',
    avisoSha256: H('a'),
    surface: 'registro' as const,
    purpose: 'necesarias' as const,
    granted: true,
    method: 'casilla' as const,
    ...o,
  });

  beforeAll(async () => {
    db = createDb(url as string);
    await recordPrivacyConsent(db, ctx(yo), grant({}));
    await recordPrivacyConsent(db, ctx(yo), grant({ purpose: 'novedades', method: 'tacito' }));
    await recordPrivacyConsent(
      db,
      ctx(yo),
      grant({ purpose: 'novedades', surface: 'configuracion', granted: false, method: 'boton' }),
    );
    await recordPrivacyConsent(
      db,
      ctx(yo),
      grant({
        avisoVersion: '0.3-borrador',
        avisoSha256: H('b'),
        surface: 'reconsentimiento',
        method: 'boton',
      }),
    );
    await recordPrivacyConsent(db, ctx(otra), grant({ purpose: 'novedades', method: 'tacito' }));
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
  });

  it('returns the latest row per purpose: the new aviso, and novedades off', async () => {
    const rows = await consentsOfUser(db, yo);
    const by = Object.fromEntries(rows.map((r) => [r.purpose, r]));
    assert.equal(rows.length, 2);
    assert.equal(by.necesarias?.avisoVersion, '0.3-borrador');
    assert.equal(by.novedades?.granted, false);
    assert.match(by.necesarias?.createdAt ?? '', /^\d{4}-\d{2}-\d{2}T.*Z$/);
  });

  it('never returns another account’s rows', async () => {
    const rows = await consentsOfUser(db, otra);
    assert.deepEqual(
      rows.map((r) => r.purpose),
      ['novedades'],
    );
  });

  it('an account with no rows reads empty', async () => {
    assert.deepEqual(await consentsOfUser(db, randomUUID()), []);
  });

  it('the ledger itself stays unreadable and append-only for the app role', async () => {
    const cause = (e: unknown) => String((e as { cause?: Error }).cause?.message ?? e);
    await assert.rejects(db.execute(sql`SELECT 1 FROM xangarro.privacy_consents`), (e) =>
      /permission denied/.test(cause(e)),
    );
  });
});
