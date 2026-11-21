import { plano } from '@xangarro/guias';

import { ACCOUNT_ITEMS, NAV_GROUPS, type NavItem } from './nav-items';

/** A place the ⌘K palette can take you, with the menu group it lives in. */
export interface Destino {
  readonly item: NavItem;
  readonly group: string;
}

const DESTINOS: readonly Destino[] = [
  ...NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ item, group: g.label ?? '' }))),
  ...ACCOUNT_ITEMS.map((item) => ({ item, group: 'Cuenta' })),
];

/**
 * Every destination whose name or group contains the query; all of them for
 * an empty one. Accents and case aside, the way the help search folds them
 * (`plano`): «revision» finds «Revisión de caja».
 */
export function matches(query: string): readonly Destino[] {
  const q = plano(query.trim());
  if (q === '') return DESTINOS;
  return DESTINOS.filter((d) => plano(`${d.item.label} ${d.group}`).includes(q));
}
