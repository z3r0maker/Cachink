import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { supabaseEnv } from './env';

/**
 * A Supabase client bound to this request's cookies, for server components
 * and server actions. A new one per request — never shared (see @supabase/ssr).
 *
 * Server components cannot write cookies; the `try` lets a token refresh
 * there fail quietly, because `src/proxy.ts` has already refreshed the
 * session on the way in. Server actions can write, and do.
 */
export async function supabaseServer(): Promise<SupabaseClient> {
  const jar = await cookies();
  const { url, anonKey } = supabaseEnv();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) jar.set(name, value, options);
        } catch {
          // Rendering a server component: the proxy owns the refresh.
        }
      },
    },
  });
}
