import { USAGE_FILTERS, type ListUsageInput, type UsageFilter } from '@/server/usage/list';

import { one, oneOf, type SearchParams } from '../search-params';

/** The usage page's URL is its state: `?filtro=sobre|dos_meses&cursor=`. */
export function parseUsageFilter(sp: SearchParams): UsageFilter {
  return oneOf(one(sp, 'filtro'), USAGE_FILTERS) ?? 'todos';
}

export function toUsageListInput(filtro: UsageFilter, cursor: string | null): ListUsageInput {
  return { filtro, ...(cursor ? { cursor } : {}) };
}

export function usageHref(filtro: UsageFilter, cursor?: string): string {
  const q = new URLSearchParams();
  if (filtro !== 'todos') q.set('filtro', filtro);
  if (cursor) q.set('cursor', cursor);
  const s = q.toString();
  return s === '' ? '/uso' : `/uso?${s}`;
}
