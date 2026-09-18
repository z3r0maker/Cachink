/**
 * Reading a console list's state out of its URL. Unknown values are ignored
 * rather than rejected — a hand-edited URL shows the unfiltered list, not an
 * error. Shared by the inbox and the tenant list.
 */
export type SearchParams = Readonly<Record<string, string | string[] | undefined>>;

/** The first value of `key`, or null when absent or empty. */
export function one(sp: SearchParams, key: string): string | null {
  const v = sp[key];
  const s = Array.isArray(v) ? v[0] : v;
  return s === undefined || s.trim() === '' ? null : s;
}

export function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return allowed.find((a) => a === value) ?? null;
}
