import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { SupportItem } from '@xangarro/domain';

import { handleIngest, INGEST_SECRET_HEADER, MAX_BODY_BYTES } from '@/server/ingest/handle';
import { secretMatches } from '@/server/ingest/secret';
import { InMemorySupportItems } from '@/server/inbox/memory';

import { brokenRepo, idSeq, NOW } from './support/inbox';

// Named for `.gitleaks.toml`'s allowlist: a random-looking shared secret reads
// as a live credential to gitleaks' generic-api-key rule. `secretMatches`
// hashes both sides and imposes no shape, so every assertion is unchanged.
const SECRET = 'ci-only-not-a-real-secret';
const URL_ = 'https://admin.xangarro.mx/api/internal/support-items';

const payload = {
  kind: 'bug',
  title: 'La app se cierra',
  source: 'bug-report',
  sourceRef: 'evt_9',
  urgent: true,
};

function request(body: unknown, secret: string | null = SECRET): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (secret !== null) headers.set(INGEST_SECRET_HEADER, secret);
  const raw = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(URL_, { method: 'POST', headers, body: raw });
}

function setup(secret: string = SECRET, repo = new InMemorySupportItems()) {
  const notified: SupportItem[] = [];
  const deps = {
    secret,
    repo,
    createDeps: {
      now: () => NOW,
      newId: idSeq(),
      log: () => undefined,
      notifier: { notifyUrgent: async (i: SupportItem) => void notified.push(i) },
    },
  };
  return { deps, repo, notified };
}

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>;
}

describe('POST /api/internal/support-items', () => {
  it('files an item (201), notifies once, and answers a retry with the same id (200)', async () => {
    const { deps, repo, notified } = setup();
    const first = await handleIngest(request(payload), deps);
    assert.equal(first.status, 201);
    const created = await json(first);
    assert.equal(created.created, true);
    assert.equal(created.notified, true);
    const again = await handleIngest(request(payload), deps);
    assert.equal(again.status, 200);
    assert.equal((await json(again)).id, created.id);
    assert.equal(repo.rows.size, 1);
    assert.equal(notified.length, 1);
  });

  it('refuses a missing or wrong secret with 401 and files nothing', async () => {
    const { deps, repo } = setup();
    assert.equal((await handleIngest(request(payload, null), deps)).status, 401);
    assert.equal((await handleIngest(request(payload, `${SECRET}x`), deps)).status, 401);
    assert.equal((await handleIngest(request(payload, ''), deps)).status, 401);
    assert.equal(repo.rows.size, 0);
  });

  it('is closed (503) when ADMIN_INGEST_SECRET is not configured', async () => {
    const { deps } = setup();
    const unset = { ...deps, secret: undefined };
    assert.equal((await handleIngest(request(payload, ''), unset)).status, 503);
    assert.equal((await handleIngest(request(payload, ''), { ...deps, secret: '' })).status, 503);
  });

  it('answers 400 to malformed JSON and to an invalid item', async () => {
    const { deps } = setup();
    assert.equal((await handleIngest(request('{nope'), deps)).status, 400);
    const bad = await handleIngest(request({ ...payload, kind: 'queja' }), deps);
    assert.equal(bad.status, 400);
    assert.equal((await json(bad)).error, 'invalid_item');
  });

  it('answers 413 to an oversized body', async () => {
    const { deps } = setup();
    const huge = { ...payload, body: 'x'.repeat(MAX_BODY_BYTES) };
    assert.equal((await handleIngest(request(huge), deps)).status, 413);
  });

  it('answers 500 when the store fails', async () => {
    const { deps } = setup(SECRET, brokenRepo());
    assert.equal((await handleIngest(request(payload), deps)).status, 500);
  });
});

describe('secretMatches', () => {
  it('matches only the exact secret, whatever the lengths', () => {
    assert.equal(secretMatches(SECRET, SECRET), true);
    assert.equal(secretMatches(SECRET.slice(0, -1), SECRET), false);
    assert.equal(secretMatches(`${SECRET}0`, SECRET), false);
    assert.equal(secretMatches(null, SECRET), false);
    assert.equal(secretMatches('', ''), false);
  });
});
