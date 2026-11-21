import { ACCOUNT_ITEMS, NAV_ITEMS } from './nav-items';

/**
 * The portal's screens by the name the menu gives them (P-48, ADR-162 §8).
 *
 * «Algo no funciona» in Ayuda names the screen the person was on, so this is
 * the one list three readers share: the shell remembers the last of these the
 * person visited, the form shows its name and offers the rest under «Fue en
 * otra», and the server files a report under one of these names and no other.
 *
 * Ayuda itself is never one: nobody reports from where they are reporting.
 */
export interface Pantalla {
  /** The screen's own address, e.g. `/movimientos`; what travels in a report. */
  readonly href: string;
  /** Its name in the menu, e.g. «Ventas y gastos». */
  readonly label: string;
  /** Other pages named by this entry: Cortes de turno sits under Equipo y nómina. */
  readonly tambien: readonly string[];
}

const AYUDA = '/ayuda';

/** Each person's own pages: reached from the bell and the account menu, not listed in either. */
const PROPIAS = [
  { label: 'Avisos', href: '/avisos' },
  { label: 'Seguridad', href: '/seguridad' },
  { label: 'Privacidad y mis datos', href: '/privacidad' },
] as const;

export const PANTALLAS: readonly Pantalla[] = [
  ...NAV_ITEMS,
  ...ACCOUNT_ITEMS.filter((item) => item.href !== AYUDA),
]
  .map((item) => ({ href: item.href, label: item.label, tambien: item.activeOn ?? [] }))
  .concat(PROPIAS.map((p) => ({ ...p, tambien: [] })));

/** The screen with exactly this address; null for anything else, a query string included. */
export function pantallaPorHref(href: string): Pantalla | null {
  return PANTALLAS.find((p) => p.href === href) ?? null;
}

/** `/` is Hoy alone; any other address also covers the pages under it. */
const covers = (base: string, pathname: string): boolean =>
  pathname === base || (base !== '/' && pathname.startsWith(`${base}/`));

/** The screen a browser path belongs to; null for Ayuda and for a page the menu does not name. */
export function pantallaDeRuta(pathname: string): Pantalla | null {
  return (
    PANTALLAS.find((p) => [p.href, ...p.tambien].some((base) => covers(base, pathname))) ?? null
  );
}
