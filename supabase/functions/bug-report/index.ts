/**
 * bug-report Edge Function — ingest endpoint for error events and bug reports.
 *
 * Routes:
 *   POST /errors       — batch of error events (auto-shipped from client outbox)
 *   POST /bug-reports  — single user-initiated bug report
 *
 * Security:
 *   - Accepts the anon key in Authorization header (standard Supabase pattern)
 *   - Inserts via service-role client (env secret, never shipped to devices)
 *   - Body size capped at ~100KB
 *   - Per-device rate limits: 200 errors/day, 20 bug reports/day
 *   - Every field validated; no stack traces accepted (defensively stripped)
 *
 * This file is only the Deno wiring: URL imports, the environment, the
 * service-role client. The rules are in `router.ts`, `handlers.ts` and
 * `validate.ts`. Checked twice (F-10, ADR-080): `deno check`/`deno lint` with
 * `deno.json`'s import map, and the repo's ESLint, `tsc` (through `deno.d.ts`)
 * and Vitest.
 */
import { createClient } from '@supabase/supabase-js';

import type { IngestStore } from './handlers.ts';
import { route } from './router.ts';

function serviceStore(): IngestStore {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  const client = createClient(url, key);
  return {
    async countSince(table, deviceId, sinceIso) {
      const { count } = await client
        .from(table)
        .select('id', { count: 'exact', head: true })
        .eq('device_id', deviceId)
        .gte('received_at', sinceIso);
      return count ?? 0;
    },
    async insert(table, rows) {
      const { error } = await client.from(table).insert(rows);
      if (error) console.error(`Insert ${table} failed:`, error);
      return !error;
    },
  };
}

Deno.serve((req) => route(req, serviceStore));
