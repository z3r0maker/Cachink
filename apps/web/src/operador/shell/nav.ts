/**
 * The operator's destinations, in the handoff's order (README, «Concha»):
 * Inicio · Cobrar, then Dinero del turno and Mi turno (ADR-107). Icon paths
 * come from the design files' `ICON` table.
 */
import { ICONS, OPERADOR_BASE } from '@xangarro/caja';

export interface OperadorNavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: string;
}

const item = (label: string, slug: string, icon: string): OperadorNavItem => ({
  label,
  href: slug ? `${OPERADOR_BASE}/${slug}` : OPERADOR_BASE,
  icon,
});

export interface OperadorNavGroup {
  /** `null` for the ungrouped top pair (Inicio, Cobrar). */
  readonly label: string | null;
  readonly items: readonly OperadorNavItem[];
}

/**
 * The register's menu in El Mostrador (ADR-107): what the operator does all
 * day first, then the money of the turno, then the turno itself. «Cobrar» is
 * the verb the counter uses; «Fiado y abonos» says what Cobranza holds.
 */
export const SIDEBAR_GROUPS: readonly OperadorNavGroup[] = [
  { label: null, items: [item('Inicio', '', ICONS.inicio), item('Cobrar', 'caja', ICONS.caja)] },
  {
    label: 'Dinero del turno',
    items: [
      item('Ventas', 'ventas', ICONS.ventas),
      item('Gastos', 'gastos', ICONS.gastos),
      item('Fiado y abonos', 'cobranza', ICONS.fiado),
    ],
  },
  {
    label: 'Mi turno',
    items: [
      item('Mi turno', 'turno', ICONS.turno),
      item('Inventario', 'inventario', ICONS.inventario),
    ],
  },
];

export const SIDEBAR_ITEMS: readonly OperadorNavItem[] = SIDEBAR_GROUPS.flatMap((g) => g.items);

/** Phone bar (< 760 px): four tabs; the rest is reached from Inicio and Mi turno. */
export const TABBAR_ITEMS: readonly OperadorNavItem[] = [
  item('Inicio', '', ICONS.inicio),
  item('Cobrar', 'caja', ICONS.caja),
  item('Ventas', 'ventas', ICONS.ventas),
  item('Mi turno', 'turno', ICONS.turno),
];

/** Exact match for Inicio; prefix match for the rest (details live below them). */
export function isActive(href: string, pathname: string): boolean {
  if (href === OPERADOR_BASE) return pathname === OPERADOR_BASE;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The header differs per screen in the design files: detail screens trade the
 * business pill for a back link, and some show the sync state as a plain pill
 * (Pendientes, Cierre) or not at all. Decided from the route, so the server
 * renders the right header with no flicker.
 */
export interface HeaderMode {
  readonly back?: { readonly label: string; readonly title: string; readonly href: string };
  /** `full`: sync link + bell · `static`: sync pill only, not a link · `none`. */
  readonly status: 'full' | 'static' | 'none';
  /** Caja swaps the bell for its «Ventas del turno» pill. */
  readonly bell?: boolean;
}

const back = (label: string, title: string, slug: string) => ({
  label,
  title,
  href: slug ? `${OPERADOR_BASE}/${slug}` : OPERADOR_BASE,
});

export function headerFor(pathname: string): HeaderMode {
  const rest = pathname.slice(OPERADOR_BASE.length + 1).split('/');
  const [first = '', second] = rest;
  if (first === 'avisos') return { back: back('Inicio', 'Volver al inicio', ''), status: 'none' };
  if (first === 'pendientes') {
    return { back: back('Volver a la caja', 'Volver a la caja', 'caja'), status: 'static' };
  }
  if (first === 'ventas' && second) {
    return { back: back('Ventas del turno', 'Volver a ventas', 'ventas'), status: 'none' };
  }
  if (first === 'cobranza' && second) {
    return { back: back('Fiado y abonos', 'Volver a fiado y abonos', 'cobranza'), status: 'none' };
  }
  if (first === 'cierre') return { status: 'static' };
  if (first === 'caja') return { status: 'full', bell: false };
  return { status: 'full' };
}
