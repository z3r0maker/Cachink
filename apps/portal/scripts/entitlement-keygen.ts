/**
 * `pnpm --filter @xangarro/portal entitlement:keygen` (B-01) — a fresh Ed25519
 * keypair for signing entitlements (contract §6).
 *
 * - `ENTITLEMENT_PRIVATE_KEY` — 32-byte secret key as 64 lowercase hex, exactly
 *   what `src/server/device/credentials.ts` reads (`ed.etc.hexToBytes`). Portal
 *   Vercel project only. Never commit it, never paste it into chat or tickets.
 * - `EXPO_PUBLIC_ENTITLEMENT_PUBKEY` — the 32-byte public key, 64 hex, baked
 *   into the phone app at build time (EAS env of `apps/mobile`, docs/plan/
 *   02-contracts.md §6). Not secret, but it must match the private key: a
 *   phone built with another key rejects every entitlement.
 *
 * Before printing, it signs and verifies a probe the way the portal and the
 * phone do, and refuses the repository's published dev key (SEC-SEC-02).
 */
import { pathToFileURL } from 'node:url';

import * as ed from '@noble/ed25519';

/** `packages/contracts/src/mock/dev-keys.json` — RFC 8032 test vector 1. */
const DEV_PUBLIC_HEX = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

export interface EntitlementKeypair {
  readonly privateHex: string;
  readonly publicHex: string;
}

export async function generateEntitlementKeypair(): Promise<EntitlementKeypair> {
  const secret = ed.utils.randomSecretKey();
  const publicHex = ed.etc.bytesToHex(await ed.getPublicKeyAsync(secret));
  const privateHex = ed.etc.bytesToHex(secret);
  if (publicHex === DEV_PUBLIC_HEX) throw new Error('generated the published dev key; run again');
  const probe = new TextEncoder().encode('xangarro-entitlement-keygen');
  const signature = await ed.signAsync(probe, ed.etc.hexToBytes(privateHex));
  if (!(await ed.verifyAsync(signature, probe, ed.etc.hexToBytes(publicHex)))) {
    throw new Error('the generated keypair failed its own sign/verify check');
  }
  return { privateHex, publicHex };
}

async function main(): Promise<void> {
  const { privateHex, publicHex } = await generateEntitlementKeypair();
  console.log('# Portal Vercel project → Environment Variables (Production), Sensitive. SECRET.');
  console.log(`ENTITLEMENT_PRIVATE_KEY=${privateHex}`);
  console.log('');
  console.log('# apps/mobile EAS env (production profile). Public; must match the key above.');
  console.log(`EXPO_PUBLIC_ENTITLEMENT_PUBKEY=${publicHex}`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
