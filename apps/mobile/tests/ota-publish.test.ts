import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, it } from 'vitest';

/**
 * `pnpm ota:publish` (N-82): the only way an update goes out. It refuses to
 * call EAS unless the private key it was given is the one the builds trust,
 * because an update signed by any other key is rejected on every register.
 * Run with `--dry-run`, so nothing here talks to EAS.
 */

const APP = resolve(import.meta.dirname, '..');
const SCRIPT = resolve(APP, 'scripts/ota-publish.mjs');
let dir = '';

function pair(name: string, days: number): { key: string; cert: string } {
  const key = join(dir, `${name}-key.pem`);
  const cert = join(dir, `${name}-cert.pem`);
  execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-nodes',
      '-keyout',
      key,
      '-out',
      cert,
      '-days',
      String(days),
      '-subj',
      '/CN=Xangarro',
      '-addext',
      'extendedKeyUsage=codeSigning',
    ],
    { stdio: 'ignore' },
  );
  return { key, cert };
}

function publish(args: readonly string[], env: Readonly<Record<string, string>>) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: APP,
    encoding: 'utf8',
    env: { PATH: process.env.PATH ?? '', HOME: dir, ...env },
  });
  return { status: r.status, out: `${r.stdout}${r.stderr}` };
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'ota-publish-'));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('ota-publish', () => {
  it('signs with the key that matches the certificate, on the channel asked for', () => {
    const { key, cert } = pair('good', 3650);
    const r = publish(
      ['--channel', 'production', '--message', 'Arreglo', '--certificate', cert, '--dry-run'],
      { XANGARRO_OTA_KEY: key },
    );
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /eas-cli update --channel production --message Arreglo/);
    assert.ok(r.out.includes(`--private-key-path ${key}`), r.out);
  });

  it('refuses when the key is not where it should be, naming the path', () => {
    const r = publish(['--channel', 'production', '--message', 'x', '--dry-run'], {});
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /\[KEY_MISSING\]/);
    assert.ok(r.out.includes(join(dir, '.xangarro/ota-signing/keys/private-key.pem')), r.out);
  });

  it('refuses a key that is not the certificate’s, before EAS is called', () => {
    const { cert } = pair('trusted', 3650);
    const { key } = pair('other', 3650);
    const r = publish(
      ['--channel', 'production', '--message', 'x', '--certificate', cert, '--dry-run'],
      { XANGARRO_OTA_KEY: key },
    );
    assert.equal(r.status, 1, r.out);
    assert.match(r.out, /\[KEY_MISMATCH\]/);
    assert.doesNotMatch(r.out, /eas-cli update/);
  });

  it('refuses without a channel or a message, and with a file that is not a key', () => {
    const { key, cert } = pair('args', 3650);
    const env = { XANGARRO_OTA_KEY: key };
    const noChannel = publish(['--message', 'x', '--certificate', cert, '--dry-run'], env);
    assert.equal(noChannel.status, 1, noChannel.out);
    assert.match(noChannel.out, /\[USAGE\]/);
    const noMessage = publish(['--channel', 'production', '--certificate', cert, '--dry-run'], env);
    assert.equal(noMessage.status, 1, noMessage.out);
    assert.match(noMessage.out, /\[USAGE\]/);
    const junk = join(dir, 'junk.pem');
    writeFileSync(junk, 'not a key');
    const bad = publish(
      ['--channel', 'production', '--message', 'x', '--certificate', cert, '--dry-run'],
      { XANGARRO_OTA_KEY: junk },
    );
    assert.equal(bad.status, 1, bad.out);
    assert.match(bad.out, /\[KEY_UNREADABLE\]/);
  });

  it('warns when the certificate has under a year left', () => {
    const { key, cert } = pair('short', 30);
    const r = publish(
      ['--channel', 'production', '--message', 'x', '--certificate', cert, '--dry-run'],
      { XANGARRO_OTA_KEY: key },
    );
    assert.equal(r.status, 0, r.out);
    assert.match(r.out, /\[CERT_EXPIRING\]/);
  });
});
