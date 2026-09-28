import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

import * as asesor from '../src/app/api/cron/asesor/route';
import * as cfdiClose from '../src/app/api/cron/cfdi-close/route';
import * as trialEmails from '../src/app/api/cron/trial-emails/route';
import * as usage from '../src/app/api/cron/usage/route';

/**
 * The four Vercel Cron routes, each wired to its real guard (`handleCron`)
 * with the job behind it swapped out: which job runs, with which clock, and
 * under which endpoint a failure is reported. The E2E server has no
 * `CRON_SECRET`, so no browser run ever gets past the guard.
 */

const job = vi.hoisted(() => ({
  calls: [] as { name: string; args: unknown[] }[],
  reported: [] as { error: unknown; scope: unknown }[],
  fail: null as Error | null,
  result: {} as object,
}));

function run(name: string) {
  return async (...args: unknown[]) => {
    job.calls.push({ name, args });
    if (job.fail) throw job.fail;
    return job.result;
  };
}

vi.mock('../src/server/observability/report', () => ({
  reportError: (error: unknown, scope: unknown) => void job.reported.push({ error, scope }),
}));
vi.mock('../src/server/asesor/fanout', () => ({
  fanOutDeps: () => ({ tag: 'fanout-deps' }),
  fanOutAsesor: run('fanOutAsesor'),
}));
vi.mock('../src/server/asesor/invocacion', () => ({
  deps: () => ({ tag: 'invocacion-deps' }),
  invocarAsesor: async (req: Request, deps: unknown) => {
    job.calls.push({ name: 'invocarAsesor', args: [req, deps] });
    return Response.json({ ok: true }, { status: 202 });
  },
}));
vi.mock('../src/server/billing/cfdi', () => ({
  liveCloseCfdiPeriod: (now: () => Date) => ({
    execute: (input: unknown) => run('closeCfdiPeriod')(now(), input),
  }),
}));
vi.mock('../src/server/usage/live', () => ({ runUsageRecompute: run('runUsageRecompute') }));
vi.mock('../src/server/email/trial-emails', () => ({ runTrialEmails: run('runTrialEmails') }));

// Named for `.gitleaks.toml`'s allowlist, like trial-cron.test.ts's.
const SECRET = 'ci-only-not-a-real-secret';

const get = (path: string, auth: string | null = `Bearer ${SECRET}`) =>
  new Request(`https://portal.test/api/cron/${path}`, {
    headers: auth === null ? {} : { authorization: auth },
  });

beforeEach(() => {
  job.calls = [];
  job.reported = [];
  job.fail = null;
  job.result = {};
  vi.stubEnv('CRON_SECRET', SECRET);
  vi.stubEnv('PORTAL_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const ROUTES = [
  { path: 'asesor', GET: asesor.GET, job: 'fanOutAsesor', failure: 'asesor_fanout_failed' },
  { path: 'cfdi-close', GET: cfdiClose.GET, job: 'closeCfdiPeriod', failure: 'cfdi_close_failed' },
  { path: 'usage', GET: usage.GET, job: 'runUsageRecompute', failure: 'usage_failed' },
  {
    path: 'trial-emails',
    GET: trialEmails.GET,
    job: 'runTrialEmails',
    failure: 'trial_emails_failed',
  },
] as const;

for (const route of ROUTES) {
  describe(`GET /api/cron/${route.path}`, () => {
    it('runs its job once with the bearer and answers the job’s result', async () => {
      job.result = { failures: [], hechos: 3 };
      const res = await route.GET(get(route.path));
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await res.json(), { ok: true, failures: [], hechos: 3 });
      assert.deepEqual(
        job.calls.map((c) => c.name),
        [route.job],
      );
    });

    it('refuses a wrong bearer without running anything', async () => {
      const res = await route.GET(get(route.path, 'Bearer nope'));
      assert.equal(res.status, 401);
      assert.equal(job.calls.length, 0);
    });

    it('stays closed while CRON_SECRET is unset', async () => {
      vi.stubEnv('CRON_SECRET', '');
      const res = await route.GET(get(route.path));
      assert.equal(res.status, 503);
      assert.deepEqual(await res.json(), { error: 'cron_disabled' });
      assert.equal(job.calls.length, 0);
    });

    it('reports a failed job under its own endpoint and answers 500', async () => {
      job.fail = new Error('db down');
      const res = await route.GET(get(route.path));
      assert.equal(res.status, 500);
      assert.deepEqual(await res.json(), { error: route.failure });
      assert.equal(job.reported.length, 1);
      assert.deepEqual(job.reported[0]?.scope, { endpoint: `cron/${route.path}` });
    });
  });
}

describe('the jobs get what they need', () => {
  it('asesor fans out over the metering deps with the request’s clock', async () => {
    await asesor.GET(get('asesor'));
    const [deps, now] = job.calls[0]?.args ?? [];
    assert.deepEqual(deps, { tag: 'fanout-deps' });
    assert.ok(now instanceof Date);
  });

  it('asesor POST is the one-business invocation, on its own deps', async () => {
    const req = new Request('https://portal.test/api/cron/asesor', { method: 'POST' });
    const res = await asesor.POST(req);
    assert.equal(res.status, 202);
    assert.equal(job.calls[0]?.name, 'invocarAsesor');
    assert.equal(job.calls[0]?.args[0], req);
    assert.deepEqual(job.calls[0]?.args[1], { tag: 'invocacion-deps' });
  });

  it('cfdi-close closes the period the clock names, with no explicit period', async () => {
    await cfdiClose.GET(get('cfdi-close'));
    const [now, input] = job.calls[0]?.args ?? [];
    assert.ok(now instanceof Date);
    assert.deepEqual(input, {});
  });

  it('trial-emails links to PORTAL_URL, or the request’s own origin without it', async () => {
    await trialEmails.GET(get('trial-emails'));
    assert.equal(job.calls[0]?.args[0], 'https://portal.test');
    vi.stubEnv('PORTAL_URL', 'https://portal.xangarro.mx/');
    await trialEmails.GET(get('trial-emails'));
    assert.equal(job.calls[1]?.args[0], 'https://portal.xangarro.mx');
  });

  it('usage reports every business whose notices failed, and still answers 200', async () => {
    job.result = {
      failures: [
        { businessId: 'b1', error: 'resend 500' },
        { businessId: 'b2', error: 'no owner' },
      ],
    };
    const res = await usage.GET(get('usage'));
    assert.equal(res.status, 200);
    assert.deepEqual(
      job.reported.map((r) => r.scope),
      [
        { endpoint: 'cron/usage', businessId: 'b1' },
        { endpoint: 'cron/usage', businessId: 'b2' },
      ],
    );
    assert.equal((job.reported[0]?.error as Error).message, 'resend 500');
  });
});
