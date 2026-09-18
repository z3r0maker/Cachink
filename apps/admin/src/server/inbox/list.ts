import { z } from 'zod';
import {
  SUPPORT_KINDS,
  SUPPORT_STATUSES,
  type BusinessId,
  type StaffMemberId,
  type SupportItem,
} from '@xangarro/domain';

import { decodeCursor, encodeCursor } from './cursor';
import { invalid, store } from './errors';
import type { SupportItemQuery, SupportItemRepository } from './port';

/** Admin's own zod builds this schema (the domain resolves another copy), so ids are re-checked here. */
const ulid = z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);

export const ListInputSchema = z.object({
  kinds: z.array(z.enum(SUPPORT_KINDS)).min(1).optional(),
  statuses: z.array(z.enum(SUPPORT_STATUSES)).min(1).optional(),
  urgent: z.boolean().optional(),
  ownerStaffId: ulid.transform((v) => v as StaffMemberId).optional(),
  businessId: ulid.transform((v) => v as BusinessId).optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).default(50),
});
export type ListInput = z.input<typeof ListInputSchema>;

export interface ListResult {
  readonly items: readonly SupportItem[];
  /** Pass back as `cursor` for the next page; null on the last page. */
  readonly nextCursor: string | null;
}

/**
 * Named views the inbox offers as chips. «Pagos sin CFDI» (ADR-070, N-33) is
 * every subscription payment still waiting for the CFDI staff issue by hand.
 */
export const SAVED_FILTERS = {
  pagos_sin_cfdi: {
    label: 'Pagos sin CFDI',
    query: { kinds: ['factura'], statuses: ['nuevo', 'en_curso'] },
  },
} as const satisfies Record<string, { label: string; query: ListInput }>;
export type SavedFilter = keyof typeof SAVED_FILTERS;

/**
 * `listSupportItems` — one page of the inbox, newest first, filtered (N-08).
 * Keyset pagination: asks the store for one row more than the page to learn
 * whether another page exists, without counting.
 */
export async function listSupportItems(
  repo: SupportItemRepository,
  input: unknown,
): Promise<ListResult> {
  const parsed = ListInputSchema.safeParse(input);
  if (!parsed.success) throw invalid(parsed.error.issues[0]?.message ?? 'Filtro inválido.');
  const { cursor, limit, ...filters } = parsed.data;
  const query: SupportItemQuery = {
    ...filters,
    after: cursor === undefined ? null : decodeCursor(cursor),
    limit: limit + 1,
  };
  const rows = await store(() => repo.list(query));
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  return { items, nextCursor: rows.length > limit && last ? encodeCursor(last) : null };
}
