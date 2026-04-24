/**
 * Shared ULID field builder for Zod entity schemas.
 *
 * Every entity in CLAUDE.md §9 carries ULID primary keys and foreign keys.
 * Rather than repeat the Crockford-base32 regex in every schema, this helper
 * provides the single source of truth for the wire-format validation while
 * preserving each entity's branded TypeScript type.
 */

import { z } from 'zod';
import type { Ulid } from '../ids/index.js';

/** 26-character Crockford-base32 ULID. Shared by every entity's id fields. */
export const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/**
 * Builds a Zod schema for a branded ULID.
 *
 * Runtime shape: 26-character string matching {@link ULID_REGEX}.
 * Compile-time type: the caller's branded subtype (e.g. `SaleId`, `BusinessId`).
 *
 * The cast is safe because branded types are zero-cost at runtime; the regex
 * enforces the actual invariant, and the brand only exists in the type system.
 */
export function ulidField<T extends Ulid>(): z.ZodType<T> {
  return z.string().regex(ULID_REGEX) as unknown as z.ZodType<T>;
}
