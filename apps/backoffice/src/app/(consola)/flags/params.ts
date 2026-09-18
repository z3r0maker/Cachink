import { PLATFORM_FLAG_KEYS, type PlatformFlagKey } from '@xangarro/domain';

import { one, oneOf, type SearchParams } from '../search-params';

/**
 * The flag page's URL is its state: `?editar=<key>&q=<búsqueda>` opens the
 * editor (with tenant search hits), `?historial=<key>` opens the drawer.
 */
export interface FlagView {
  readonly editar: PlatformFlagKey | null;
  readonly historial: PlatformFlagKey | null;
  readonly q: string | null;
}

export function parseFlagView(sp: SearchParams): FlagView {
  return {
    editar: oneOf(one(sp, 'editar'), PLATFORM_FLAG_KEYS),
    historial: oneOf(one(sp, 'historial'), PLATFORM_FLAG_KEYS),
    q: one(sp, 'q')?.trim().slice(0, 100) ?? null,
  };
}

export const editHref = (key: PlatformFlagKey) => `/flags?editar=${key}` as const;
export const historyHref = (key: PlatformFlagKey) => `/flags?historial=${key}` as const;
