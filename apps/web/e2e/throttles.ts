import postgres from 'postgres';

import { clearLocalThrottles } from '../scripts/local-throttles';

/** A spec-scoped reset of the loopback IP throttles (see local-throttles.ts). */
export async function resetIpThrottles(): Promise<void> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await clearLocalThrottles(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
