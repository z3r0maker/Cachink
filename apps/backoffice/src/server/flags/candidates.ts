import type { BusinessId } from '@xangarro/domain';

import type { TenantDirectory } from '../tenants/port';
import { flagStore } from './errors';

/** Search hits shown under the allowlist editor. */
export const SEARCH_LIMIT = 10;

export interface Candidate {
  readonly id: BusinessId;
  readonly nombre: string;
  readonly ownerEmail: string | null;
  /** Already on the key's list — rendered checked. */
  readonly listed: boolean;
}

/**
 * The allowlist editor's checkboxes: everyone already listed, then the
 * tenant search's hits (N-06's `TenantDirectory.list` search: name, owner
 * email, or exact id) that are not listed yet.
 */
export async function allowlistCandidates(
  directory: TenantDirectory,
  listed: readonly BusinessId[],
  search: string | null,
): Promise<Candidate[]> {
  const [current, hits] = await Promise.all([
    listed.length === 0
      ? Promise.resolve([])
      : flagStore(() => directory.list({ onlyIds: listed, after: null, limit: listed.length })),
    search === null
      ? Promise.resolve([])
      : flagStore(() => directory.list({ search, after: null, limit: SEARCH_LIMIT })),
  ]);
  const onList = new Set(listed);
  const known = current.map((t) => ({ ...pick(t), listed: true }));
  // A listed id the directory no longer knows still shows, so it can be removed.
  const gone = listed
    .filter((id) => !current.some((t) => t.id === id))
    .map((id) => ({ id, nombre: id, ownerEmail: null, listed: true }));
  const fresh = hits.filter((t) => !onList.has(t.id)).map((t) => ({ ...pick(t), listed: false }));
  return [...known, ...gone, ...fresh];
}

function pick(t: { id: BusinessId; nombre: string; ownerEmail: string | null }) {
  return { id: t.id, nombre: t.nombre, ownerEmail: t.ownerEmail };
}
