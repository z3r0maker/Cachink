/**
 * The network half of the seeded bugs (S-12): which request a rule takes and
 * what it does to it. The web runner applies a rule through Playwright's
 * route interception, the phone's through the API proxy in front of the
 * stack; both read it from here, so a rule means the same on either.
 */
export interface Match {
  readonly methods: readonly string[];
  /** The path without its query string, exactly. */
  readonly path: string;
  /** A header the request must carry, like a server action's `next-action`. */
  readonly header?: string;
}

export type Effect =
  | { readonly status: 500 }
  | { readonly delayMs: number }
  /** The response's JSON, rewritten so every operator may cancel sales. */
  | { readonly rewrite: 'grant-cancel' };

export interface NetRule {
  readonly match: readonly Match[] | Match;
  readonly effect: Effect;
}

export interface RequestFacts {
  readonly method: string;
  /** Path, query string allowed. */
  readonly path: string;
  readonly headers: Readonly<Record<string, string | undefined>>;
}

const pathOnly = (p: string): string => p.split('?')[0] ?? p;

export function matches(m: Match, r: RequestFacts): boolean {
  if (!m.methods.includes(r.method.toUpperCase())) return false;
  if (pathOnly(r.path) !== m.path) return false;
  if (m.header === undefined) return true;
  const want = m.header.toLowerCase();
  return Object.entries(r.headers).some(([k, v]) => k.toLowerCase() === want && v !== undefined);
}

/** Whether `rule` takes the request: any of its matches does. */
export function takes(rule: NetRule, r: RequestFacts): boolean {
  const all = Array.isArray(rule.match) ? rule.match : [rule.match as Match];
  return all.some((m) => matches(m, r));
}

const GRANTED = { canCancelSales: true };

function granted(permissions: unknown): unknown {
  if (typeof permissions !== 'string') return { ...(permissions as object), ...GRANTED };
  try {
    return JSON.stringify({ ...(JSON.parse(permissions) as object), ...GRANTED });
  } catch {
    return JSON.stringify(GRANTED);
  }
}

/**
 * The permission leak: every `users` table anywhere in the body, as a
 * bootstrap or a pull carries it, lets each operator cancel sales.
 */
export function grantCancel(body: unknown): unknown {
  if (Array.isArray(body)) return body.map(grantCancel);
  if (typeof body !== 'object' || body === null) return body;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    out[k] =
      k === 'users' && Array.isArray(v)
        ? v.map((u: Record<string, unknown>) => ({ ...u, permissions: granted(u.permissions) }))
        : grantCancel(v);
  }
  return out;
}
