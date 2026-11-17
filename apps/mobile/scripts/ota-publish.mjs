#!/usr/bin/env node
/**
 * Publish a signed OTA update (N-82, ADR-145).
 *
 *   pnpm --filter @xangarro/mobile ota:publish --channel production --message "…"
 *
 * Every build carries `certs/certificate.pem` and rejects an update that its
 * private key did not sign, so this checks the key before EAS is called: a key
 * that is missing, unreadable or not the certificate's stops here, not on the
 * registers. The key lives outside the repo and outside EAS:
 * `~/.xangarro/ota-signing/keys/private-key.pem`, or the path in
 * `XANGARRO_OTA_KEY`. Its master copy is the owner's password manager
 * (docs/ops/provisioning.md §11).
 *
 * Options: `--certificate <path>` checks against another certificate (a
 * rotation, before it is configured); `--dry-run` prints the EAS command and
 * stops.
 */
import { spawnSync } from 'node:child_process';
import { X509Certificate, createPrivateKey, createPublicKey } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const DEFAULT_CERT = new URL('../certs/certificate.pem', import.meta.url);
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

class PublishError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function options(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      channel: { type: 'string' },
      message: { type: 'string' },
      certificate: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  });
  if (!values.channel || !values.message) {
    throw new PublishError('USAGE', 'ota:publish --channel <channel> --message "<what changed>"');
  }
  return values;
}

function keyPath(env) {
  return env.XANGARRO_OTA_KEY || join(homedir(), '.xangarro/ota-signing/keys/private-key.pem');
}

function readKey(path) {
  if (!existsSync(path)) {
    throw new PublishError(
      'KEY_MISSING',
      `no signing key at ${path}. Restore it from the password manager (docs/ops/provisioning.md §11) or set XANGARRO_OTA_KEY.`,
    );
  }
  try {
    return createPrivateKey(readFileSync(path));
  } catch {
    throw new PublishError('KEY_UNREADABLE', `${path} is not a PEM private key.`);
  }
}

function spki(key) {
  return key.export({ type: 'spki', format: 'der' });
}

/** The key must be the certificate's: anything else is rejected on every register. */
function checkPair(key, cert) {
  if (!spki(createPublicKey(key)).equals(spki(cert.publicKey))) {
    throw new PublishError(
      'KEY_MISMATCH',
      'this key did not make the certificate the builds trust; an update signed with it would be rejected.',
    );
  }
  const left = new Date(cert.validTo).getTime() - Date.now();
  if (left <= 0) {
    throw new PublishError(
      'CERT_EXPIRED',
      `the certificate expired ${cert.validTo}; only a new binary ships now.`,
    );
  }
  if (left < YEAR_MS) {
    console.warn(
      `⚠ [CERT_EXPIRING] the certificate expires ${cert.validTo}: rotate it in the next store build.`,
    );
  }
}

function easArgs(values, key) {
  return [
    'eas-cli',
    'update',
    '--channel',
    values.channel,
    '--message',
    values.message,
    '--private-key-path',
    key,
    '--non-interactive',
  ];
}

function main(argv, env) {
  const values = options(argv);
  const path = keyPath(env);
  const key = readKey(path);
  checkPair(key, new X509Certificate(readFileSync(values.certificate ?? DEFAULT_CERT)));
  const args = easArgs(values, path);
  console.log(`✓ Signing key matches the certificate. npx ${args.join(' ')}`);
  if (values['dry-run']) return 0;
  return spawnSync('npx', ['--yes', ...args], { stdio: 'inherit' }).status ?? 1;
}

try {
  process.exitCode = main(process.argv.slice(2), process.env);
} catch (error) {
  const code = error instanceof PublishError ? error.code : 'FAILED';
  console.error(`✗ ota:publish [${code}]: ${error.message}`);
  process.exitCode = 1;
}
