/**
 * Shared primitive-field builders for entity schemas.
 *
 * Money lives as bigint centavos across every entity; ISO calendar dates
 * (YYYY-MM-DD) appear wherever an entity has a transactional `fecha`. Factor
 * them here so new entities pick them up without re-deriving the regex or
 * the branded-type cast.
 */

import { z } from 'zod';
import type { IsoDate } from '../dates/index.js';
import type { Money } from '../money/index.js';

/** ISO 8601 calendar date (YYYY-MM-DD), projected to the branded {@link IsoDate}. */
export const isoDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((v) => v as IsoDate);

/** Money field — bigint centavos (CLAUDE.md §2 principle 8). */
export const moneyField = z.bigint() as unknown as z.ZodType<Money>;
