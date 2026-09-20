import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  assistedFilesOf,
  assistedFileBytes,
  claimForApproval,
  createAssistedImport,
  expireStaleAssistedImports,
  hasActiveAssistedImport,
  latestAssistedImport,
  markForApproval,
  purgeResolvedAssistedImportFiles,
  rejectAssistedImport,
} from '../src/queries/index';
import { integrationSuite } from './support/db';
import { BIZ_A, BIZ_B, seedTwoTenants } from './support/tenants';

/**
 * 0026 — the N-18 state machine as SQL invariants: the tenant's approve is a
 * guarded claim (staff cannot apply, double-apply is impossible), reject
 * covers cancel, requests are tenant-isolated, and the cron sweeps (expiry,
 * LFPDPPP purge) touch only what is due.
 */
const { url, describe } = integrationSuite();

const FILE = Buffer.from('sistema,datos\nExcel,ventas 2024');

describe('0026 assisted imports', () => {
  let app: Db;
  let admin: Db;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = createDb(url as string);
    // The sweeps run as a privileged drizzle connection (the digest cron uses
    // the admin role; the superuser exercises the same SQL rule here — the
    // admin-role policies land with the backoffice migration).
    admin = createDb(process.env.DATABASE_SUPER_URL as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    await seedTwoTenants(owner);
  });

  afterAll(async () => {
    await app?.$client.end({ timeout: 5 });
    await admin?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('a request is created in revision with its files, one at a time', async () => {
    assert.equal(await withBusiness(app, BIZ_A, (tx) => hasActiveAssistedImport(tx, BIZ_A)), false);
    const row = await withBusiness(app, BIZ_A, (tx) =>
      createAssistedImport(tx, {
        businessId: BIZ_A,
        sistemaActual: 'Excel',
        notas: 'ventas y clientes',
        requestedBy: null,
        files: [{ filename: 'respaldo.csv', mime: 'text/csv', bytes: FILE }],
      }),
    );
    assert.equal(row.status, 'revision');
    assert.equal(await withBusiness(app, BIZ_A, (tx) => hasActiveAssistedImport(tx, BIZ_A)), true);
    const files = await withBusiness(app, BIZ_A, (tx) => assistedFilesOf(tx, row.id));
    assert.equal(files.length, 1);
    assert.equal(files[0]?.role, 'solicitud');

    const again = await withBusiness(app, BIZ_B, (tx) =>
      createAssistedImport(tx, {
        businessId: BIZ_B,
        sistemaActual: 'Libreta',
        notas: '',
        requestedBy: null,
        files: [],
      }),
    );
    assert.equal(again.status, 'revision');
    assert.equal(await withBusiness(app, BIZ_B, (tx) => hasActiveAssistedImport(tx, BIZ_B)), true);
  });

  it('another business never sees the row or its files', async () => {
    const theirs = await withBusiness(app, BIZ_B, (tx) => latestAssistedImport(tx, BIZ_A));
    assert.equal(theirs, null);
    const mine = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    const files = await withBusiness(app, BIZ_B, (tx) => assistedFilesOf(tx, mine?.id ?? 'x'));
    assert.equal(files.length, 0);
  });

  it('the tenant cannot claim a request staff has not sent; staff can, exactly once', async () => {
    const nobody = await withBusiness(app, BIZ_A, (tx) => claimForApproval(tx, BIZ_A));
    assert.equal(nobody, null, 'nothing to approve while still in revision');

    const mine = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    const sent = await withBusiness(app, BIZ_A, (tx) =>
      markForApproval(tx, {
        id: mine?.id as string,
        businessId: BIZ_A,
        plantilla: 'clientes',
        file: { filename: 'clientes-mapeado.csv', mime: 'text/csv', bytes: FILE },
      }),
    );
    assert.equal(sent, true);
    const twice = await withBusiness(app, BIZ_A, (tx) =>
      markForApproval(tx, {
        id: mine?.id as string,
        businessId: BIZ_A,
        plantilla: 'clientes',
        file: { filename: 'otro.csv', mime: 'text/csv', bytes: FILE },
      }),
    );
    assert.equal(twice, false, 'a sent request cannot be re-sent');
  });

  it('the tenant claims the approval once and gets the mapped file; a second claim is null', async () => {
    const claim = await withBusiness(app, BIZ_A, (tx) => claimForApproval(tx, BIZ_A));
    assert.ok(claim !== null);
    assert.equal(claim.plantilla, 'clientes');
    assert.equal(claim.file.filename, 'clientes-mapeado.csv');
    assert.deepEqual(claim.file.bytes, FILE);

    const again = await withBusiness(app, BIZ_A, (tx) => claimForApproval(tx, BIZ_A));
    assert.equal(again, null, 'already applied');
    const row = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    assert.equal(row?.status, 'aplicada');
    assert.ok(row?.resolvedAt !== null);
  });

  it('reject resolves a pending request; the mapped file bytes stay readable for staff until purge', async () => {
    assert.equal(await withBusiness(app, BIZ_B, (tx) => rejectAssistedImport(tx, BIZ_B)), true);
    const row = await withBusiness(app, BIZ_B, (tx) => latestAssistedImport(tx, BIZ_B));
    assert.equal(row?.status, 'rechazada');
    assert.equal(
      await withBusiness(app, BIZ_B, (tx) => rejectAssistedImport(tx, BIZ_B)),
      false,
      'already resolved',
    );

    const mine = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    const files = await withBusiness(app, BIZ_A, (tx) => assistedFilesOf(tx, mine?.id as string));
    const bytes = await withBusiness(app, BIZ_A, (tx) =>
      assistedFileBytes(tx, files[0]?.id as string),
    );
    assert.deepEqual(bytes?.bytes, FILE);
  });

  it('the cron sweeps: 14-day-old approvals expire, 30-day-old resolutions purge their files', async () => {
    // A third business: a request left in esperando_aprobacion 15 days ago.
    const C = '01HZ8XQN9GZJXV8AKQ5X0C7CCC';
    await owner`SELECT set_config('xangarro.business_id', ${C}, false)`;
    await owner`INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
                 VALUES (${C}, 'Negocio C', 'RESICO', 125, ${C}, 'dev', now(), now())
                 ON CONFLICT (id) DO NOTHING`;
    const stale = await withBusiness(app, C, (tx) =>
      createAssistedImport(tx, {
        businessId: C,
        sistemaActual: 'Otro',
        notas: '',
        requestedBy: null,
        files: [{ filename: 'r.csv', mime: 'text/csv', bytes: FILE }],
      }),
    );
    await withBusiness(app, C, (tx) =>
      markForApproval(tx, {
        id: stale.id,
        businessId: C,
        plantilla: 'productos',
        file: { filename: 'm.csv', mime: 'text/csv', bytes: FILE },
      }),
    );
    await owner`UPDATE assisted_imports SET updated_at = now() - interval '15 days'
                 WHERE id = ${stale.id}`;

    assert.equal(await expireStaleAssistedImports(admin), 1);
    const expired = await withBusiness(app, C, (tx) => latestAssistedImport(tx, C));
    assert.equal(expired?.status, 'expirada');
    // Fresh resolutions are not due: nothing purged yet.
    assert.equal(await purgeResolvedAssistedImportFiles(admin), 0);

    // Age A's applied row past the purge horizon; its files go, the row stays.
    const mine = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    await owner`UPDATE assisted_imports SET resolved_at = now() - interval '31 days'
                 WHERE id = ${mine?.id}`;
    const purged = await purgeResolvedAssistedImportFiles(admin);
    assert.ok(purged >= 2, `both files of the aged row (got ${purged})`);
    const after = await withBusiness(app, BIZ_A, (tx) => assistedFilesOf(tx, mine?.id as string));
    assert.equal(after.length, 0, 'the bytes are gone');
    const row = await withBusiness(app, BIZ_A, (tx) => latestAssistedImport(tx, BIZ_A));
    assert.equal(row?.status, 'aplicada', 'the record itself stays');
    assert.ok(row?.filesPurgedAt !== null);
    // Idempotent: a second run purges nothing.
    assert.equal(await purgeResolvedAssistedImportFiles(admin), 0);
  });
});
