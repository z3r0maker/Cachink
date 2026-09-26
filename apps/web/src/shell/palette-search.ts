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

/** Accent- and case-insensitive: «revision» finds «Revisión de caja». */
const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Every destination whose name or group contains the query; all of them for an empty one. */
export function matches(query: string): readonly Destino[] {
  const q = fold(query.trim());
  if (q === '') return DESTINOS;
  return DESTINOS.filter((d) => fold(`${d.item.label} ${d.group}`).includes(q));
}
