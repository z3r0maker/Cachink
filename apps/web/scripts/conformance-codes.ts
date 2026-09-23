/**
 * Mint fresh activation codes for the contract conformance suite.
 *
 * The suite (`packages/contracts/tests/conformance/`) consumes one code per
 * redemption test via `CONFORMANCE_CODES`. Codes are single-use, so they have
 * to be minted fresh for every run — and minted with the **same** function the
 * portal uses, so the suite exercises codes the portal could actually issue.
 *
 *   DATABASE_URL=… tsx scripts/conformance-codes.ts 6
 *   DATABASE_URL=… tsx scripts/conformance-codes.ts 3 --qr   # scan tokens (C-14)
 *
 * Prints the codes (or, with `--qr`, the raw pairing tokens) comma-separated on
 * stdout and nothing else, for `$(…)`. `--qr` mints each token on its own code
 * with the portal's own minter and stores only the hash, as «Mostrar QR» does.
 */
import postgres from 'postgres';

import { CODE_TTL_MS, mintActivationCode } from '../src/lib/activation-code';
import { hashPairingToken, mintPairingToken, pairingExpiry } from '../src/lib/pairing-token';
import { clearLocalThrottles } from './local-throttles';

// The conformance tenant, not the demo business (see CONFORMANCE in seed-data):
// it activates real devices, and Taquería Don Pedro is seeded at its limit.
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0CNF01';
const EMAIL = 'conformance@xangarro.mx';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') throw new Error('DATABASE_URL is required.');
  const count = Number(process.argv[2] ?? '6');
  const qr = process.argv.includes('--qr');

  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    // Each run activates devices, and the plan caps them. Revoking the previous
    // run's phones gives this one free slots — on the conformance tenant only.
    await sql`UPDATE devices SET revoked_at = now(), updated_at = now() WHERE revoked_at IS NULL`;
    await clearLocalThrottles(sql);
    const now = new Date();
    const expires = new Date(now.getTime() + CODE_TTL_MS).toISOString();
    const out: string[] = [];
    while (out.length < count) {
      const code = mintActivationCode();
      const token = qr ? mintPairingToken() : null;
      const inserted = await sql`
        INSERT INTO activation_codes (code, email, expires_at, business_id, qr_token_hash, qr_expires_at, created_at, updated_at)
        VALUES (${code}, ${EMAIL}, ${expires}, ${BIZ}, ${token === null ? null : hashPairingToken(token)},
                ${token === null ? null : pairingExpiry(now, expires)}, ${now.toISOString()}, ${now.toISOString()})
        ON CONFLICT (code) DO NOTHING
        RETURNING code`;
      if (inserted.length > 0) out.push(token ?? code);
    }
    process.stdout.write(out.join(','));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
