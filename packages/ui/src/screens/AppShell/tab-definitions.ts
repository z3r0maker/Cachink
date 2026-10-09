/**
 * The caja's destinations on the phone and the tablet (Track M, M-05), in
 * the web caja's order (`operador/shell/nav.ts`): Inicio · Cobrar, then the
 * money of the turno, then the turno itself. The glyphs are the web's
 * `ICONS` from `@xangarro/caja`.
 *
 * - Phone (< 760 px): exactly four tabs, Inicio, Cobrar, Ventas, Mi turno
 *   (`appTabs()`); everything else opens from Inicio and Mi turno.
 * - Rail and sidebar (≥ 760 px): the grouped menu (`navGroups()`), the web's
 *   `SIDEBAR_GROUPS` (Fiado y abonos joined with M-08).
 */

import { ICONS } from '@xangarro/caja';

export type NavKey =
  | 'inicio'
  | 'cobrar'
  | 'ventas'
  | 'gastos'
  | 'cobranza'
  | 'turno'
  | 'inventario';

export interface TabDefinition {
  /** Stable identifier: the tab's `activeKey` and its `tab-<key>` testID. */
  readonly key: NavKey;
  /** i18n key under `shell.nav.*`. */
  readonly labelKey: `shell.nav.${NavKey}`;
  /** SVG path data (a 24 × 24 box) from the caja's `ICONS`. */
  readonly icon: string;
  /** The Expo Router path. */
  readonly path: string;
}

const def = (key: NavKey, icon: string, path: string): TabDefinition => ({
  key,
  labelKey: `shell.nav.${key}`,
  icon,
  path,
});

export const NAV: Readonly<Record<NavKey, TabDefinition>> = {
  inicio: def('inicio', ICONS.inicio, '/inicio'),
  cobrar: def('cobrar', ICONS.caja, '/cobrar'),
  ventas: def('ventas', ICONS.ventas, '/ventas'),
  gastos: def('gastos', ICONS.gastos, '/egresos'),
  cobranza: def('cobranza', ICONS.fiado, '/cobranza'),
  turno: def('turno', ICONS.turno, '/turno'),
  inventario: def('inventario', ICONS.inventario, '/inventario'),
};

/** The phone's bottom tabs: exactly four. */
export function appTabs(): readonly TabDefinition[] {
  return [NAV.inicio, NAV.cobrar, NAV.ventas, NAV.turno];
}

export interface NavGroup {
  /** `null` for the ungrouped top pair; otherwise an i18n key. */
  readonly labelKey: 'shell.nav.dinero' | 'shell.nav.turno' | null;
  readonly items: readonly TabDefinition[];
}

/** The rail's and the sidebar's menu, grouped like the web's sidebar. */
export function navGroups(): readonly NavGroup[] {
  return [
    { labelKey: null, items: [NAV.inicio, NAV.cobrar] },
    { labelKey: 'shell.nav.dinero', items: [NAV.ventas, NAV.gastos, NAV.cobranza] },
    { labelKey: 'shell.nav.turno', items: [NAV.turno, NAV.inventario] },
  ];
}

/**
 * The destination a pathname belongs to: a detail route lights its parent
 * (`/cobranza/c1` → Fiado y abonos, `/checkout/fiado` → Cobrar). Avisos
 * lights Inicio and Registros por enviar lights Cobrar, as their boards do
 * (MvAvisos, MvPendientes). Unknown paths (settings, caja-movimientos) belong
 * to Mi turno, where they are opened from.
 */
const DESTINO: Readonly<Record<string, NavKey>> = {
  '': 'inicio',
  inicio: 'inicio',
  avisos: 'inicio',
  cobrar: 'cobrar',
  checkout: 'cobrar',
  'nuevo-producto': 'cobrar',
  pendientes: 'cobrar',
  ventas: 'ventas',
  egresos: 'gastos',
  cobranza: 'cobranza',
  inventario: 'inventario',
};

export function navKeyFor(pathname: string): NavKey {
  const first = pathname.replace(/^\/+/, '').split('/')[0] ?? '';
  return DESTINO[first] ?? 'turno';
}

/** On the phone, the tab a destination lives under (Gastos, Fiado y abonos, Inventario → Mi turno). */
export function tabKeyFor(key: NavKey): NavKey {
  return key === 'gastos' || key === 'cobranza' || key === 'inventario' ? 'turno' : key;
}
