import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { X509Certificate } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';

/**
 * OTA update code signing (N-82, ADR-145). A production build embeds the
 * certificate at prebuild and refuses any update not signed by its private
 * key, so an EAS account or token alone cannot ship JavaScript to the
 * registers. The private key never enters the repo.
 */

interface AppJson {
  readonly expo: {
    readonly updates?: {
      readonly codeSigningCertificate?: string;
      readonly codeSigningMetadata?: { readonly keyid?: string; readonly alg?: string };
    };
  };
}

const APP = resolve(import.meta.dirname, '..');
const app = JSON.parse(readFileSync(resolve(APP, 'app.json'), 'utf8')) as AppJson;
const CODE_SIGNING_EKU = '1.3.6.1.5.5.7.3.3';

function certificate(): X509Certificate {
  const path = app.expo.updates?.codeSigningCertificate;
  assert.ok(path, 'updates.codeSigningCertificate is not set');
  return new X509Certificate(readFileSync(resolve(APP, path)));
}

describe('OTA code signing', () => {
  it('points the updates config at the committed certificate, with the metadata EAS signs for', () => {
    assert.equal(app.expo.updates?.codeSigningCertificate, './certs/certificate.pem');
    assert.deepEqual(app.expo.updates?.codeSigningMetadata, {
      keyid: 'main',
      alg: 'rsa-v1_5-sha256',
    });
    assert.ok(existsSync(resolve(APP, 'certs/certificate.pem')));
  });

  it('is a code-signing certificate for Xangarro, good for years, not days', () => {
    const cert = certificate();
    assert.match(cert.subject, /CN=Xangarro/);
    assert.ok(cert.keyUsage?.includes(CODE_SIGNING_EKU), `EKU: ${cert.keyUsage}`);
    assert.equal(cert.publicKey.asymmetricKeyType, 'rsa');
    // Expired means no OTA for every build carrying it, ever: only a new binary.
    assert.ok(new Date(cert.validTo) > new Date('2035-01-01'), `valid to ${cert.validTo}`);
  });

  it('keeps every private key out of the repo', () => {
    const tracked = execFileSync('git', ['ls-files', '-z', '--', '.'], {
      cwd: APP,
      encoding: 'utf8',
    })
      .split('\0')
      .filter((f) => f.endsWith('.pem') || f.endsWith('.key'));
    // EAS builds from git: an ignored certificate would ship a build that trusts nothing.
    assert.ok(tracked.includes('certs/certificate.pem'), 'certs/certificate.pem is not tracked');
    for (const file of tracked) {
      assert.doesNotMatch(readFileSync(resolve(APP, file), 'utf8'), /PRIVATE KEY/, file);
    }
    const ignored = execFileSync('git', ['check-ignore', 'keys/private-key.pem'], {
      cwd: APP,
      encoding: 'utf8',
    });
    assert.equal(ignored.trim(), 'keys/private-key.pem');
  });
});
