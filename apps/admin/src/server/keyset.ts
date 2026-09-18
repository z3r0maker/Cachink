import { ULID_REGEX } from '@xangarro/domain';

/**
 * Keyset cursors shared by the console's lists (inbox, tenants): the
 * `createdAt|id` of the last row shown, base64url so it survives a query
 * string. Opaque to the browser and decoded strictly, because it comes back
 * from the URL. Each list wraps this with its own error and id brand.
 */
export interface Keyset {
  readonly createdAt: string;
  readonly id: string;
}

export function encodeKeyset(row: Keyset): string {
  return Buffer.from(`${row.createdAt}|${row.id}`, 'utf8').toString('base64url');
}

/** The decoded position, or null for anything that is not one we issued. */
export function decodeKeyset(raw: string): Keyset | null {
  const [createdAt, id, ...rest] = Buffer.from(raw, 'base64url').toString('utf8').split('|');
  if (rest.length > 0 || createdAt === undefined || id === undefined) return null;
  if (Number.isNaN(Date.parse(createdAt)) || !ULID_REGEX.test(id)) return null;
  return { createdAt, id };
}
