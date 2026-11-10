/**
 * `pnpm --filter @xangarro/data-pg check:data-api` — after O-2 and every hosted
 * migration (audit SEC-DATA-01, ADR-138): asks the hosted project's Data API
 * for Xangarro rows with the anon key, and with a device token when
 * `DEVICE_TOKEN` is set, and fails unless every answer is a refusal or empty.
 *
 * Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, optional `DEVICE_TOKEN`. Prints
 * statuses only, never a key or a row.
 */
import { intentos, veredicto } from './hosted/data-api';

const TABLAS = ['sales', 'businesses', 'users', 'subscriptions'] as const;

function requerido(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set.`);
  return v;
}

async function main(): Promise<number> {
  const url = requerido('SUPABASE_URL').replace(/\/$/, '');
  const anon = requerido('SUPABASE_ANON_KEY');
  let fallas = 0;
  for (const i of intentos(anon, process.env.DEVICE_TOKEN)) {
    for (const t of TABLAS) {
      const r = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
        headers: { apikey: anon, Authorization: `Bearer ${i.bearer}` },
      });
      const v = veredicto(r.status, await r.text());
      console.log(`${v === 'cerrada' ? 'ok  ' : 'FAIL'} ${i.nombre} → ${t}: ${r.status} (${v})`);
      if (v !== 'cerrada') fallas += 1;
    }
  }
  return fallas === 0 ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  },
);
