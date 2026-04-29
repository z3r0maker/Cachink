/**
 * Tab definitions for the Operativo and Director bottom tab bars
 * (CLAUDE.md §1). Each entry is the static metadata — `label` is an i18n
 * key, `path` is the route each app's router resolves. The app-shell
 * route file wires these into `BottomTabBar`'s `items` by attaching an
 * onPress handler per definition.
 *
 * Kept separate from the screen component so tab lists can be referenced
 * from deep-links, tests, or the Maestro flows without mounting React.
 *
 * Per ADR-040 the `icon` field is a curated `IconName` from the
 * `<Icon>` primitive — emoji glyphs were retired in the April 2026
 * design refresh.
 */

import type { IconName } from '../../components/Icon/index';

export interface TabDefinition {
  /** Stable identifier used as BottomTabBar `activeKey`. */
  readonly key: string;
  /** i18n key under `tabs.*` (e.g. `ventas` → `t('tabs.ventas')`). */
  readonly labelKey: string;
  /** Vector glyph name from the curated `<Icon>` set (ADR-040). */
  readonly icon: IconName;
  /**
   * Route path used by the app-shell router to navigate. Mobile uses
   * Expo Router segments; desktop will use wouter paths. Both agree on
   * these top-level strings.
   */
  readonly path: string;
}

/** Operativo — 3 tabs per CLAUDE.md §1. */
export const OPERATIVO_TABS: readonly TabDefinition[] = [
  { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
  { key: 'egresos', labelKey: 'tabs.egresos', icon: 'file-text', path: '/egresos' },
  { key: 'productos', labelKey: 'tabs.productos', icon: 'package', path: '/productos' },
] as const;

/**
 * Director — 6 tabs per CLAUDE.md §1. Clientes is reached from Director
 * Home + the Venta form, not from a top-level tab.
 */
export const DIRECTOR_TABS: readonly TabDefinition[] = [
  { key: 'home', labelKey: 'tabs.home', icon: 'home', path: '/' },
  { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
  { key: 'egresos', labelKey: 'tabs.egresos', icon: 'file-text', path: '/egresos' },
  { key: 'productos', labelKey: 'tabs.productos', icon: 'package', path: '/productos' },
  { key: 'estados', labelKey: 'tabs.estados', icon: 'chart-bar', path: '/estados' },
  { key: 'ajustes', labelKey: 'tabs.ajustes', icon: 'settings', path: '/ajustes' },
] as const;

/** Pick the right tab list for the current role. */
export function tabsForRole(role: 'operativo' | 'director'): readonly TabDefinition[] {
  return role === 'director' ? DIRECTOR_TABS : OPERATIVO_TABS;
}
