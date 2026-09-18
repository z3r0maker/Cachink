import type { StaffMemberId, SupportItem } from '@xangarro/domain';

import { store, SupportItemError } from './errors';
import { loadItem, type Clock } from './load';
import type { SupportItemRepository } from './port';

export interface AssignInput {
  readonly id: unknown;
  /** The staff member taking it — in the console, always the one signed in. */
  readonly staffId: StaffMemberId;
}

export interface AssignResult {
  readonly item: SupportItem;
  /** For the audit payload: who had it before, or null. */
  readonly previousOwner: StaffMemberId | null;
}

/** `assignSupportItem` — give an open item an owner (N-08). A resolved item is closed to it. */
export async function assignSupportItem(
  repo: SupportItemRepository,
  input: AssignInput,
  clock: Clock,
): Promise<AssignResult> {
  const before = await loadItem(repo, input.id);
  if (before.status === 'resuelto') {
    throw new SupportItemError('ALREADY_RESOLVED', 'El item ya está resuelto.');
  }
  const item: SupportItem = {
    ...before,
    ownerStaffId: input.staffId,
    updatedAt: clock.now().toISOString(),
  };
  await store(() => repo.update(item));
  return { item, previousOwner: before.ownerStaffId };
}
