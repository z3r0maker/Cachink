import { SupportItemIdSchema, type SupportItem } from '@xangarro/domain';

import { SupportItemError } from './errors';
import type { ListCursor } from './port';

/**
 * Keyset cursors for the inbox list: `createdAt|id` of the last row shown,
 * base64url so it survives a query string. Opaque to the browser; decoded
 * strictly, because it comes back from the URL.
 */
export function encodeCursor(item: Pick<SupportItem, 'createdAt' | 'id'>): string {
  return Buffer.from(`${item.createdAt}|${item.id}`, 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): ListCursor {
  const bad = new SupportItemError('INVALID_CURSOR', 'La página pedida no es válida.');
  const [createdAt, id, ...rest] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
  if (rest.length > 0 || createdAt === undefined || Number.isNaN(Date.parse(createdAt))) throw bad;
  const parsedId = SupportItemIdSchema.safeParse(id);
  if (!parsedId.success) throw bad;
  return { createdAt: new Date(createdAt).toISOString(), id: parsedId.data };
}
