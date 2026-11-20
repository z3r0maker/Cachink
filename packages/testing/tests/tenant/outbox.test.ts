// @vitest-environment node
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, it } from 'vitest';

import { latestMailTo, linkIn } from '../../src/tenant/index.js';

/**
 * The dev email outbox (B-14): the portal's e2e and Synth's signup runs
 * (S-10) both read the link a message carries from the `.eml` it wrote.
 */
const TOKEN = 'a'.repeat(43);

function eml(to: string, body: string): string {
  const b64 = Buffer.from(body, 'utf8').toString('base64');
  return `From: hola@xangarro.mx\r\nTo: ${to}\r\nSubject: Confirma\r\n\r\n${b64}\r\n`;
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'outbox-'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('the outbox', () => {
  it('finds the link in the newest message to an address', async () => {
    writeFileSync(
      join(dir, '1.eml'),
      eml('lupita@ejemplo.mx', `/signup/confirmar?t=${'b'.repeat(43)}`),
    );
    utimesSync(join(dir, '1.eml'), 1, 1);
    writeFileSync(
      join(dir, '2.eml'),
      eml('lupita@ejemplo.mx', `Entra: /signup/confirmar?t=${TOKEN}`),
    );
    assert.equal(
      await linkIn(dir, 'lupita@ejemplo.mx', '/signup/confirmar'),
      `/signup/confirmar?t=${TOKEN}`,
    );
  });

  it('answers null for a folder that does not exist yet', async () => {
    assert.equal(await latestMailTo(join(dir, 'nada'), 'lupita@ejemplo.mx'), null);
  });

  it('ignores mail to another address, even one that contains this one', async () => {
    writeFileSync(
      join(dir, '1.eml'),
      eml('otra.lupita@ejemplo.mx', `/signup/confirmar?t=${TOKEN}`),
    );
    assert.equal(await linkIn(dir, 'lupita@ejemplo.mx', '/signup/confirmar'), null);
  });

  it('answers null when the message carries no such link', async () => {
    writeFileSync(join(dir, '1.eml'), eml('lupita@ejemplo.mx', `/login/entrar?t=${TOKEN}`));
    assert.equal(await linkIn(dir, 'lupita@ejemplo.mx', '/signup/confirmar'), null);
  });
});
