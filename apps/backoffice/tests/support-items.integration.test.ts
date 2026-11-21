import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { createDb, type Db } from '@xangarro/data-pg';
import type { SupportItemId } from '@xangarro/domain';
import { integrationSuite } from '@xangarro/testing/integration';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';

import { drizzleSupportItems } from '@/server/db/support-items';
import { createSupportItem } from '@/server/inbox/create';

/**
 * The inbox's bug-report columns (0024, B-21, ADR-162) against a real
 * Postgres, as the console's own `xangarro_admin` role. The seed has no
 * support items, so every row is built here: one as 0019 left it (the
 * old → new case, CLAUDE.md §2.9), a report that is only a tap, one that
 * names its error, and a resend.
 *
 * Needs the admin migrations on top of data-pg's (`test:e2e:db`, or CI's
 * backoffice-e2e job, which runs this with REQUIRE_DB=1).
 */
const { url, describe } = integrationSuite();
const SUPER = process.env.DATABASE_SUPER_URL ?? '';

const RUN = randomBytes(6).toString('hex');
const SOURCE = 'bug-report';
const ref = (name: string) => `b21-${RUN}:${name}`;
const newId = () =>
  `01B21${randomBytes(12).toString('hex').toUpperCase()}`.slice(0, 26) as SupportItemId;
const EVENT_ID = '9f2c41d0a7b84e3c95d1f0a2b6c7e41a';
const NOW = new Date('2026-11-20T20:14:07.000Z');

describe('a bug report’s category and error in Postgres (0024)', () => {
  let owner: postgres.Sql;
  let admin: Db;
  const deps = { now: () => NOW, newId, log: () => undefined };
  const report = (name: string, over: Record<string, unknown> = {}) => ({
    kind: 'bug',
    title: 'No me dejó cobrar',
    body: '',
    source: SOURCE,
    sourceRef: ref(name),
    ...over,
  });

  beforeAll(() => {
    owner = postgres(SUPER, { max: 1, onnotice: () => undefined });
    admin = createDb(url as string);
  });

  afterAll(async () => {
    // The console may not delete an item; the owner clears what this run filed.
    await owner`DELETE FROM support_items WHERE source_ref LIKE ${`b21-${RUN}:%`}`;
    await owner.end();
  });

  it('reads a row filed before 0024, which names neither, as nulls', async () => {
    const id = newId();
    await owner`
      INSERT INTO support_items
        (id, kind, status, urgent, title, body, attachments, source, source_ref, created_at, updated_at)
      VALUES (${id}, 'bug', 'nuevo', false, 'Reporte del teléfono 01HZ8XQN…', 'La app se cerró',
              '[]'::jsonb, ${SOURCE}, ${ref('before')}, now(), now())`;
    const item = await drizzleSupportItems(admin).findById(id);
    assert.equal(item?.category, null);
    assert.equal(item?.eventId, null);
    assert.equal(item?.body, 'La app se cerró');
  });

  it('files a report that is only a tap, and one that names its error', async () => {
    const repo = drizzleSupportItems(admin);
    const tap = await createSupportItem(
      repo,
      report('tap', { category: 'could_not_charge' }),
      deps,
    );
    assert.equal(tap.created, true);
    const named = await createSupportItem(
      repo,
      report('named', { category: 'froze_or_closed', eventId: EVENT_ID, body: 'Se cerró sola' }),
      deps,
    );
    const [first, second] = await Promise.all([
      repo.findById(tap.item.id),
      repo.findById(named.item.id),
    ]);
    assert.deepEqual(
      [first?.category, first?.eventId, first?.body],
      ['could_not_charge', null, ''],
    );
    assert.deepEqual(
      [second?.category, second?.eventId, second?.body],
      ['froze_or_closed', EVENT_ID, 'Se cerró sola'],
    );
  });

  it('files nothing new on a resend, and keeps what the first one said', async () => {
    const repo = drizzleSupportItems(admin);
    const first = await createSupportItem(
      repo,
      report('resend', { category: 'wrong_number' }),
      deps,
    );
    const again = await createSupportItem(repo, report('resend', { category: 'other' }), deps);
    assert.equal(again.created, false);
    assert.equal(again.item.id, first.item.id);
    assert.equal(again.item.category, 'wrong_number');
    const rows = await owner`
      SELECT count(*)::int AS n FROM support_items WHERE source_ref = ${ref('resend')}`;
    assert.equal(rows[0]?.n, 1);
  });

  it('lists them with both fields, newest first', async () => {
    const items = await drizzleSupportItems(admin).list({
      kinds: ['bug'],
      after: null,
      limit: 200,
    });
    const mine = items.filter((i) => i.sourceRef.startsWith(`b21-${RUN}:`));
    assert.ok(mine.some((i) => i.eventId === EVENT_ID));
    assert.ok(mine.some((i) => i.category === 'could_not_charge'));
  });

  it('is refused by Postgres itself on another kind, or in another shape', async () => {
    const insert = (kind: string, category: string | null, eventId: string | null) => owner`
      INSERT INTO support_items
        (id, kind, status, urgent, title, body, attachments, source, source_ref,
         created_at, updated_at, category, event_id)
      VALUES (${newId()}, ${kind}, 'nuevo', false, 't', '', '[]'::jsonb, ${SOURCE},
              ${ref(`check-${randomBytes(4).toString('hex')}`)}, now(), now(), ${category}, ${eventId})`;
    await assert.rejects(insert('ayuda', 'other', null), /support_items_bug_category/);
    await assert.rejects(insert('bug', 'se_trabo', null), /support_items_bug_category/);
    await assert.rejects(insert('sistema', null, EVENT_ID), /support_items_bug_event/);
    await assert.rejects(insert('bug', null, EVENT_ID.toUpperCase()), /support_items_bug_event/);
  });
});
