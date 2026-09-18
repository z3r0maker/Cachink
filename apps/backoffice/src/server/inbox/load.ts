import { SupportItemIdSchema, type SupportItem } from '@xangarro/domain';

import { invalid, store, SupportItemError } from './errors';
import type { SupportItemRepository } from './port';

/** Validate an id from the outside world and load its item, or throw `NOT_FOUND`. */
export async function loadItem(repo: SupportItemRepository, id: unknown): Promise<SupportItem> {
  const parsed = SupportItemIdSchema.safeParse(id);
  if (!parsed.success) throw invalid('Id de item inválido.');
  const item = await store(() => repo.findById(parsed.data));
  if (item === null) throw new SupportItemError('NOT_FOUND', 'Ese item no existe.');
  return item;
}

export interface Clock {
  readonly now: () => Date;
}
