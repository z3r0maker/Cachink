import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

/**
 * The release script's three guards, which exist because the first manual
 * release after `cec30e12` hit all three traps.
 *
 * These read the script as text rather than running it: a real run applies
 * migrations to the production database and ships three apps. The two
 * refusals — a dirty tree and a HEAD that is not `origin/main` — were verified
 * by running them against a scratch worktree on 2026-09-26; this keeps the
 * properties they depend on from being edited away afterwards.
 */
const ROOT = join(import.meta.dirname, '..');
const SCRIPT = join(ROOT, 'scripts/release.sh');
const source = (): string => readFileSync(SCRIPT, 'utf8');

describe('release.sh', () => {
  it('is executable, so the documented invocation works', () => {
    const mode = execFileSync('git', ['ls-files', '-s', 'scripts/release.sh'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    assert.match(mode, /^100755 /, 'committed without the executable bit');
  });

  it('refuses a dirty tree, because production takes the working tree', () => {
    const s = source();
    assert.match(s, /git status --porcelain/);
    assert.match(s, /would ship/, 'the refusal has to say why, not just fail');
  });

  it('refuses a HEAD that is not origin/main', () => {
    const s = source();
    assert.match(s, /git rev-parse origin\/main/);
    assert.match(s, /HEAD_SHA.*==.*MAIN_SHA|"\$HEAD_SHA" == "\$MAIN_SHA"/);
  });

  it('migrates before it deploys, and stops if the migration fails', () => {
    const s = source();
    const migrate = s.indexOf('db:migrate:hosted');
    const deploy = s.indexOf('vercel@latest deploy');
    assert.ok(migrate > 0 && deploy > 0, 'both steps must be present');
    assert.ok(
      migrate < deploy,
      'provisioning.md §138: migrations apply before the code that needs them',
    );
    assert.match(s, /nothing was deployed/, 'a failed migration must not fall through to a deploy');
  });

  it('deploys from the repo root, not the app directory', () => {
    // The trap: Root Directory is already `apps/web` in project settings, so
    // `vercel deploy` run inside `apps/web` looks for `apps/web/apps/web` and
    // fails. The projects are selected by env var instead of a `.vercel` dir,
    // so the root needs no link and the three cannot fight over one.
    const s = source();
    assert.match(s, /cd "\$ROOT" && VERCEL_ORG_ID=/);
    assert.match(s, /VERCEL_PROJECT_ID=/);
    assert.doesNotMatch(s, /cd "\$ROOT\/apps\/\$app".*vercel/s);
  });

  it('checks each deployment reached Ready rather than assuming', () => {
    const s = source();
    assert.match(s, /vercel@latest inspect/);
    assert.match(s, /Ready/);
  });

  it('names every app the repo deploys', () => {
    const s = source();
    for (const app of ['web', 'backoffice', 'landing']) {
      assert.ok(s.includes(app), `apps/${app} is deployable but unnamed in ALL_APPS`);
    }
  });
});
