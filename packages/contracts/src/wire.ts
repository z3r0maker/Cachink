/**
 * JSON wire codec. Domain money is `bigint`, which JSON cannot carry, so
 * every bigint field travels as a decimal string and is restored by the
 * receiving schema. Which fields are bigint is read from the zod schema
 * itself — nothing is guessed per table.
 */

import { z } from 'zod';

type AnySchema = z.ZodType;

interface ZodDefLike {
  readonly type?: string;
  readonly innerType?: AnySchema;
  readonly shape?: Record<string, AnySchema>;
}
function defOf(s: AnySchema): ZodDefLike {
  return (s as unknown as { _zod: { def: ZodDefLike } })._zod.def;
}

/** True when the schema is `z.bigint()` under any nullable/optional/default wrapper. */
export function isBigIntSchema(s: AnySchema): boolean {
  const d = defOf(s);
  if (d.type === 'bigint') return true;
  if (d.innerType) return isBigIntSchema(d.innerType);
  return false;
}

/** Top-level keys of an object schema whose values are bigint. */
export function bigintKeys(objectSchema: AnySchema): readonly string[] {
  const shape = defOf(objectSchema).shape ?? {};
  return Object.entries(shape)
    .filter(([, v]) => isBigIntSchema(v))
    .map(([k]) => k);
}

const DECIMAL = /^-?\d+$/;

/**
 * A schema that accepts the wire form (bigint fields as decimal strings) and
 * parses into the domain form. Non-string values pass through so in-process
 * callers can hand it real bigints.
 */
export function wireSchema<S extends AnySchema>(objectSchema: S): z.ZodType<z.infer<S>> {
  const keys = bigintKeys(objectSchema);
  if (keys.length === 0) return objectSchema as unknown as z.ZodType<z.infer<S>>;
  return z.preprocess((raw) => {
    if (raw === null || typeof raw !== 'object') return raw;
    const out: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
    for (const k of keys) {
      const v = out[k];
      if (typeof v === 'string' && DECIMAL.test(v)) out[k] = BigInt(v);
    }
    return out;
  }, objectSchema) as unknown as z.ZodType<z.infer<S>>;
}

/** JSON.stringify that encodes bigint as a decimal string. */
export function encodeJson(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));
}

/** JSON.parse without bigint restoration — pair it with a `wireSchema` parse. */
export function decodeJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}
