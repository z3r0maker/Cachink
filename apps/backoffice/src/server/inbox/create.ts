/**
 * `createSupportItem` — file an inbox item (N-08). Idempotent by
 * `(source, sourceRef)`: a source that retries a delivery gets the first item
 * back and nobody is notified twice.
 */
import { z } from 'zod';
import {
  newEntityId,
  SupportItemSchema,
  type SupportItem,
  type SupportItemId,
} from '@xangarro/domain';

import type { UrgentNotifier } from '../alerts/urgent-notifier';
import { invalid, store } from './errors';
import type { SupportItemRepository } from './port';

/**
 * What a source sends. Everything else (status, owner, timestamps) is ours.
 * Only the shape is checked here; the values are checked by the domain's
 * `SupportItemSchema` (kinds, paths, the factura rule) — one set of rules.
 * (Domain schemas are not composed into this one: the domain resolves its own
 * copy of zod.)
 */
export const NewSupportItemSchema = z.object({
  kind: z.string(),
  urgent: z.boolean().default(false),
  businessId: z.string().nullable().default(null),
  title: z.string(),
  body: z.string().default(''),
  attachments: z.array(z.string()).default([]),
  source: z.string(),
  sourceRef: z.string(),
  paymentRef: z.string().nullable().default(null),
  /** `arco` only: the deadline to answer, an ISO instant (N-34). */
  dueAt: z.string().nullable().default(null),
});
export type NewSupportItem = z.input<typeof NewSupportItemSchema>;

export interface CreateDeps {
  readonly now: () => Date;
  readonly newId?: () => SupportItemId;
  readonly notifier?: UrgentNotifier;
  readonly log?: (message: string, error: unknown) => void;
}

export interface CreateResult {
  readonly item: SupportItem;
  readonly created: boolean;
  /** True only when this call created an urgent item and the notifier accepted it. */
  readonly notified: boolean;
}

function build(input: unknown, deps: CreateDeps): SupportItem {
  const fields = NewSupportItemSchema.safeParse(input);
  if (!fields.success) throw invalid(fields.error.issues[0]?.message ?? 'Item inválido.');
  const at = deps.now().toISOString();
  const parsed = SupportItemSchema.safeParse({
    ...fields.data,
    id: (deps.newId ?? newEntityId<SupportItemId>)(),
    status: 'nuevo',
    ownerStaffId: null,
    cfdiUuid: null,
    createdAt: at,
    updatedAt: at,
    resolvedAt: null,
  });
  if (!parsed.success) throw invalid(parsed.error.issues[0]?.message ?? 'Item inválido.');
  return parsed.data;
}

async function notify(item: SupportItem, deps: CreateDeps): Promise<boolean> {
  if (!deps.notifier) return false;
  try {
    await deps.notifier.notifyUrgent(item);
    return true;
  } catch (error) {
    (deps.log ?? console.error)('urgent notification failed', error);
    return false;
  }
}

export async function createSupportItem(
  repo: SupportItemRepository,
  input: unknown,
  deps: CreateDeps,
): Promise<CreateResult> {
  const candidate = build(input, deps);
  const { item, created } = await store(() => repo.insertIfAbsent(candidate));
  const notified = created && item.urgent ? await notify(item, deps) : false;
  return { item, created, notified };
}
