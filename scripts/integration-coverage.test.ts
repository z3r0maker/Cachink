/**
 * Guards integration *coverage*, not integration *cleanliness*.
 *
 * `packages/data-pg/tests/{rls,queries}.integration.test.ts` self-skipped when
 * `DATABASE_URL` was unset, and CI never set one. So fourteen assertions about
 * cross-tenant isolation reported as "skipped" beside twenty-two green drift
 * tests, for as long as the package had existed — and the job was green. A
 * suite that silently skips is worse than a missing suite: it launders an
 * unproven policy as proven.
 *
 * Sibling of `./lint-coverage.test.ts`, same two-part shape:
 *   1. every integration suite really runs, in a Postgres-backed CI job;
 *   2. the escape hatch has not grown to swallow them — which is how (1)
 *      would otherwise be "fixed".
 *
 * Both read the real workflow and the real package scripts, so they cannot
 * drift from what CI runs. This file needs no database itself: it is run by the
 * hermetic `ci` job, which proves that *another* job has one.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parse } from 'yaml';
import { describe, it } from 'vitest';

const REPO = resolve(import.meta.dirname, '..');
const WORKFLOW = join(REPO, '.github/workflows/ci.yml');

interface Manifest {
  readonly name?: string;
  readonly scripts?: Record<string, string>;
}

interface Job {
  readonly services?: Record<string, { readonly image?: string }>;
  readonly steps?: readonly { readonly run?: string }[];
}

const readJson = (path: string): Manifest => JSON.parse(readFileSync(path, 'utf8')) as Manifest;

/**
 * The suites at risk: those that depend on an **external** database.
 *
 * Not every `*.integration.test.ts` qualifies. `packages/data`'s run the
 * migration against an in-memory `better-sqlite3` — hermetic, no daemon, and
 * they already run in `pnpm test`. A suite can only skip *silently* if it
 * decides to based on `DATABASE_URL`, so depending on that variable is exactly
 * the property that puts a suite in scope here.
 *
 * A suite needing a database while mentioning neither would fail rather than
 * skip, which is loud, and is the failure mode we want anyway.
 */
function integrationSuites(): readonly string[] {
  const out = execFileSync('git', ['ls-files', '*.integration.test.ts'], {
    cwd: REPO,
    encoding: 'utf8',
  });
  return out
    .split('\n')
    .filter((f) => f.length > 0)
    .filter((f) => {
      const src = readFileSync(join(REPO, f), 'utf8');
      return src.includes('DATABASE_URL') || src.includes('integrationSuite');
    });
}

/** Workspace package name → its directory, for `--filter` resolution. */
function packageDirs(): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const parent of ['apps', 'packages']) {
    const dir = join(REPO, parent);
    if (!existsSync(dir)) continue;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = join(dir, entry.name, 'package.json');
      if (!existsSync(manifest)) continue;
      const { name } = readJson(manifest);
      if (name !== undefined) map.set(name, `${parent}/${entry.name}`);
    }
  }
  return map;
}

/** Jobs whose `services` include a Postgres image. */
function postgresBackedJobs(): readonly Job[] {
  const workflow = parse(readFileSync(WORKFLOW, 'utf8')) as { jobs?: Record<string, Job> };
  return Object.values(workflow.jobs ?? {}).filter((job) =>
    Object.values(job.services ?? {}).some((s) => /^postgres[:@]/.test(s.image ?? '')),
  );
}

/** `pnpm --filter <pkg> <script>` occurrences in a job's `run` strings. */
function scriptsRunBy(job: Job): readonly { pkg: string; script: string }[] {
  const found: { pkg: string; script: string }[] = [];
  for (const step of job.steps ?? []) {
    for (const m of (step.run ?? '').matchAll(/--filter\s+(\S+)\s+(?:run\s+)?(\S+)/g)) {
      found.push({ pkg: m[1] ?? '', script: m[2] ?? '' });
    }
  }
  return found;
}

/**
 * A suite is covered when some Postgres-backed job runs a script of its own
 * package that sets BOTH `DATABASE_URL` and `REQUIRE_DB=1` — and that job also
 * applies the schema and seeds first, since the query suite asserts real rows.
 */
function isCovered(suite: string, dirs: ReadonlyMap<string, string>): boolean {
  return postgresBackedJobs().some((job) => {
    const ran = scriptsRunBy(job);
    const prepares =
      ran.some((r) => r.script === 'db:apply') && ran.some((r) => r.script === 'db:seed');
    if (!prepares) return false;

    return ran.some(({ pkg, script }) => {
      const dir = dirs.get(pkg);
      if (dir === undefined || !suite.startsWith(`${dir}/`)) return false;
      const body = readJson(join(REPO, dir, 'package.json')).scripts?.[script] ?? '';
      return body.includes('DATABASE_URL') && body.includes('REQUIRE_DB=1');
    });
  });
}

describe('integration coverage', () => {
  it('runs every integration suite in a CI job with a real Postgres', () => {
    const dirs = packageDirs();
    const suites = integrationSuites();

    assert.ok(suites.length >= 3, `expected the repo's integration suites, found ${suites.length}`);

    const uncovered = suites.filter((s) => !isCovered(s, dirs));
    assert.deepEqual(
      uncovered,
      [],
      `${uncovered.length} integration suite(s) never run against a database in CI.\n` +
        `${uncovered.map((s) => `  ${s}`).join('\n')}\n\n` +
        'They will skip, and the job will be green. Add a Postgres-backed job to ' +
        '.github/workflows/ci.yml that runs `db:apply`, `db:seed`, and a script ' +
        'setting DATABASE_URL and REQUIRE_DB=1.',
    );
  });

  it('does not skip its way to a green result', () => {
    // The cheap way to satisfy the test above is to stop the suites being
    // suites. Both escape hatches are asserted directly: a file that reinvents
    // `describe.skip` locally opts out of the REQUIRE_DB fuse entirely.
    const offenders: string[] = [];
    for (const suite of integrationSuites()) {
      const src = readFileSync(join(REPO, suite), 'utf8');
      if (!src.includes('integrationSuite'))
        offenders.push(`${suite} — does not use integrationSuite()`);
      if (/\bdescribe\.skip\b/.test(src)) offenders.push(`${suite} — reinvents describe.skip`);
    }

    assert.deepEqual(
      offenders,
      [],
      `${offenders.length} integration suite(s) bypass the REQUIRE_DB fuse:\n` +
        `${offenders.map((o) => `  ${o}`).join('\n')}\n\n` +
        'Use `integrationSuite()` so a missing database fails instead of skipping.',
    );
  });
});
