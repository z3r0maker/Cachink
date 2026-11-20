import type { z } from 'zod';

/** Each issue as `path: message`, the shape `validate.ts` prints. */
export function issues(schema: z.ZodType, value: unknown): string[] {
  const r = schema.safeParse(value);
  if (r.success) return [];
  return r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
}

/** The paths that failed, for asserting where a value went wrong. */
export function failingPaths(schema: z.ZodType, value: unknown): string[] {
  const r = schema.safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

/** A copy of `base` with `patch` laid over it, one level deep per key. */
export function withPatch<T extends object>(base: T, patch: Record<string, unknown>): unknown {
  return { ...base, ...patch };
}
