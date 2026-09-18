/**
 * Mint fresh activation codes for the contract conformance suite.
 *
 * The suite (`packages/contracts/tests/conformance/`) consumes one code per
 * redemption test via `CONFORMANCE_CODES`. Codes are single-use, so they have
 * to be minted fresh for every run — and minted with the **same** function the
 * portal uses, so the suite exercises codes the portal could actually issue.
 *
 *   DATABASE_URL=… tsx scripts/conformance-codes.ts 6
 *
 * Prints the codes comma-separated on stdout and nothing else, for `$(…)`.
 */
import postgres from 'postgres';

import { CODE_TTL_MS, mintActivationCode } from '../src/lib/activation-code';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const EMAIL = 'pedro@taqueria.mx';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') throw new Error('DATABASE_URL is required.');
  const count = Number(process.argv[2] ?? '6');

  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const now = new Date();
    const expires = new Date(now.getTime() + CODE_TTL_MS).toISOString();
    const codes: string[] = [];
    while (codes.length < count) {
      const code = mintActivationCode();
      const inserted = await sql`
        INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
        VALUES (${code}, ${EMAIL}, ${expires}, ${BIZ}, ${now.toISOString()}, ${now.toISOString()})
        ON CONFLICT (code) DO NOTHING
        RETURNING code`;
      if (inserted.length > 0) codes.push(code);
    }
    process.stdout.write(codes.join(','));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main();
