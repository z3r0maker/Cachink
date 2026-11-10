import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';

/**
 * The release configuration gate (audit F-15d), run as EAS runs it: the
 * script as its own Node process, with the environment a build profile
 * hands it. Only the production profile is judged; development, preview and
 * a plain local run pass untouched, whatever they carry.
 */

const APP = resolve(import.meta.dirname, '..');
const SCRIPT = resolve(APP, 'scripts/check-release-config.mjs');
const KEY = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
const DEV_KEY = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const GOOD = {
  EXPO_PUBLIC_API_BASE: 'https://app.xangarro.mx',
  EXPO_PUBLIC_ENTITLEMENT_PUBKEY: KEY,
};

function gate(env: Readonly<Record<string, string>>, nodeFlags: readonly string[] = []) {
  const r = spawnSync(process.execPath, [...nodeFlags, SCRIPT], {
    cwd: APP,
    encoding: 'utf8',
    // Only PATH is inherited: nothing of this machine's own configuration.
    env: { PATH: process.env.PATH ?? '', ...env },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe('check-release-config', () => {
  it('passes a production build with an https base and the backend’s key', () => {
    const r = gate({ EAS_BUILD_PROFILE: 'production', ...GOOD });
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /release configuration: ok/i);
  });

  it('fails a production build with nothing set, naming both variables', () => {
    const r = gate({ EAS_BUILD_PROFILE: 'production' });
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /EXPO_PUBLIC_API_BASE \[API_BASE_MISSING\]/);
    assert.match(r.out, /EXPO_PUBLIC_ENTITLEMENT_PUBKEY \[PUBKEY_MALFORMED\]/);
  });

  it('fails on the values eas.json carries today, handed over as written', () => {
    const r = gate({
      EAS_BUILD_PROFILE: 'production',
      EXPO_PUBLIC_API_BASE: '$PRODUCTION_API_BASE',
      EXPO_PUBLIC_ENTITLEMENT_PUBKEY: '$PRODUCTION_ENTITLEMENT_PUBKEY',
    });
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /\[API_BASE_NOT_HTTPS\].*\$PRODUCTION_API_BASE.*placeholder/);
    assert.match(r.out, /\[PUBKEY_MALFORMED\]/);
  });

  it('fails a production build that is plain http or signs with the dev key', () => {
    const http = gate({
      EAS_BUILD_PROFILE: 'production',
      ...GOOD,
      EXPO_PUBLIC_API_BASE: 'http://app.xangarro.mx',
    });
    assert.equal(http.status, 1, http.out);
    assert.match(http.out, /\[API_BASE_NOT_HTTPS\]/);
    const dev = gate({
      EAS_BUILD_PROFILE: 'production',
      ...GOOD,
      EXPO_PUBLIC_ENTITLEMENT_PUBKEY: DEV_KEY,
    });
    assert.equal(dev.status, 1, dev.out);
    assert.match(dev.out, /\[PUBKEY_IS_DEV_KEY\]/);
  });

  it('judges the same on a Node that does not read TypeScript itself (through tsx)', () => {
    const older = ['--no-experimental-strip-types'];
    const bad = gate({ EAS_BUILD_PROFILE: 'production' }, older);
    assert.equal(bad.status, 1, bad.out);
    assert.match(bad.out, /\[API_BASE_MISSING\]/);
    assert.equal(gate({ EAS_BUILD_PROFILE: 'production', ...GOOD }, older).status, 0);
  });

  it('does nothing for the development and preview profiles, whatever they carry', () => {
    for (const profile of ['development', 'preview']) {
      const r = gate({ EAS_BUILD_PROFILE: profile, EXPO_PUBLIC_API_BASE: 'http://localhost:3000' });
      assert.deepEqual([r.status, r.out], [0, ''], profile);
    }
  });

  it('does nothing outside an EAS build (a local expo start or run)', () => {
    assert.deepEqual(gate({}), { status: 0, out: '' });
  });
});

describe('the EAS hook', () => {
  const pkg = JSON.parse(readFileSync(resolve(APP, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };
  const hook = pkg.scripts['eas-build-post-install'] ?? '';

  it('runs the gate first, and only then what it ran before', () => {
    assert.match(hook, /^node scripts\/check-release-config\.mjs && \(/);
    assert.match(hook, /install-skia/);
    // Grouped: a failed gate must not fall through to the `||` of the Skia step.
    assert.match(hook, /\)$/);
  });

  it('is not wired into any local script', () => {
    for (const [name, command] of Object.entries(pkg.scripts)) {
      if (name === 'eas-build-post-install') continue;
      assert.equal(command.includes('check-release-config'), false, name);
    }
  });
});
