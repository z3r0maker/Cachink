import type { SupportItem, SupportItemId } from '@xangarro/domain';

import { decodeKeyset, encodeKeyset } from '../keyset';
import { SupportItemError } from './errors';
import type { ListCursor } from './port';

/** Keyset cursors for the inbox list — see `../keyset.ts`. */
export function encodeCursor(item: Pick<SupportItem, 'createdAt' | 'id'>): string {
  return encodeKeyset(item);
}

export function decodeCursor(raw: string): ListCursor {
  const key = decodeKeyset(raw);
  if (key === null) throw new SupportItemError('INVALID_CURSOR', 'La página pedida no es válida.');
  return { createdAt: new Date(key.createdAt).toISOString(), id: key.id as SupportItemId };
}
