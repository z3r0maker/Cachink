/**
 * The operator's destinations, in the handoff's order (README, «Concha»):
 * Inicio · Caja · Turno · Ventas · Gastos · Inventario · Cobranza. Icon paths
 * are copied from the design files' `ICON` table.
 */
export const OPERADOR_BASE = '/operador';

export const ICONS = {
  inicio: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
  caja: 'M4 4h16v16H4V4Zm4 4h8M8 12h3m5 0h.01M8 16h3m5 0h.01',
  turno: 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
  ventas: 'M3 6h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 9H6',
  gastos: 'M12 3v14M6 11l6 6 6-6M4 21h16',
  inventario: 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm8-4v20M4 8l8 4 8-4',
  cobranza: 'M4 6h16v12H4V6Zm3 12v2m10-2v2M8 12h8',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  /** Lucide `lock`: the design's `<rect x=4 y=11 w=16 h=10 rx=2>` as a path. */
  lock: 'M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2ZM8 11V7a4 4 0 0 1 8 0v4',
} as const;

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

export const SIDEBAR_ITEMS: readonly OperadorNavItem[] = [
  item('Inicio', '', ICONS.inicio),
  item('Caja', 'caja', ICONS.caja),
  item('Turno', 'turno', ICONS.turno),
  item('Ventas', 'ventas', ICONS.ventas),
  item('Gastos', 'gastos', ICONS.gastos),
  item('Inventario', 'inventario', ICONS.inventario),
  item('Cobranza', 'cobranza', ICONS.cobranza),
];

/** Phone bar (< 760 px): four tabs; the rest is reached from Inicio and Turno. */
export const TABBAR_ITEMS: readonly OperadorNavItem[] = [
  item('Inicio', '', ICONS.inicio),
  item('Caja', 'caja', ICONS.caja),
  item('Ventas', 'ventas', ICONS.ventas),
  item('Turno', 'turno', ICONS.turno),
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
    return { back: back('Cobranza', 'Volver a cobranza', 'cobranza'), status: 'none' };
  }
  if (first === 'cierre') return { status: 'static' };
  return { status: 'full' };
}
