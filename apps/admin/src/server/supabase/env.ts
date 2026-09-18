/**
 * Supabase project coordinates for the admin console.
 *
 * Auth runs server-to-server only (server actions and the proxy), so neither
 * value is `NEXT_PUBLIC_` — the browser never talks to Supabase, which is also
 * why the CSP needs no third-party `connect-src`.
 *
 * This project is the **only** one allowed to hold `SUPABASE_SERVICE_ROLE_KEY`
 * (ADR-063); nothing in N-05 needs it yet — auth uses the anon key plus the
 * staff member's own session.
 */
export interface SupabaseEnv {
  readonly url: string;
  readonly anonKey: string;
}

export function supabaseEnv(): SupabaseEnv {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set for the admin console.');
  }
  return { url, anonKey };
}
