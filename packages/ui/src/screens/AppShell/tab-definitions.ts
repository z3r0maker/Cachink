/**
 * Tab definitions for the bottom tab bar.
 *
 * Operativo always has 5 tabs — Caja is permanently present (not gated).
 * The 4th tab swaps between Merma/Productos based on feature flags.
 *
 * Operativo (merma ON):  Ventas | Caja | Pagos | Merma    | Otros
 * Operativo (merma OFF): Ventas | Caja | Pagos | Productos | Otros
 * Director (always):     Home | Ventas | Estados | Otros
 *
 * "Pagos" is the UI label for the Egresos tab (code identifiers stay
 * `expense`/`egreso` — purely a label change).
 */

import type { FeatureFlags } from '@cachink/domain';
import type { IconName } from '../../components/Icon/index';

export interface TabDefinition {
  /** Stable identifier used as BottomTabBar `activeKey`. */
  readonly key: string;
  /** i18n key under `tabs.*` (e.g. `ventas` → `t('tabs.ventas')`). */
  readonly labelKey: string;
  /** Vector glyph name from the curated `<Icon>` set (ADR-040). */
  readonly icon: IconName;
  /** Route path used by the app-shell router to navigate. */
  readonly path: string;
}

/** Operativo tabs — dynamic based on merma flag. Always 5 tabs. */
export function operativoTabs(flags: FeatureFlags): readonly TabDefinition[] {
  const tabs: TabDefinition[] = [
    { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
    { key: 'caja', labelKey: 'tabs.caja', icon: 'landmark', path: '/caja' },
    { key: 'gastos', labelKey: 'tabs.pagos', icon: 'file-text', path: '/egresos' },
  ];
  if (flags.merma) {
    tabs.push({ key: 'merma', labelKey: 'tabs.merma', icon: 'trending-down', path: '/merma' });
  } else {
    tabs.push({
      key: 'productos',
      labelKey: 'tabs.productos',
      icon: 'package',
      path: '/productos',
    });
  }
  tabs.push({ key: 'otros', labelKey: 'tabs.otros', icon: 'layout-grid', path: '/otros' });
  return tabs;
}

/** Director tabs — always the same 4 tabs. */
export const DIRECTOR_TABS: readonly TabDefinition[] = [
  { key: 'home', labelKey: 'tabs.home', icon: 'home', path: '/' },
  { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
  { key: 'estados', labelKey: 'tabs.estados', icon: 'chart-bar', path: '/estados' },
  { key: 'otros', labelKey: 'tabs.otros', icon: 'layout-grid', path: '/otros' },
] as const;

/**
 * Pick the right tab list for the current role + flags.
 *
 * @deprecated old 2-arg signature — use `tabsForRole(role, flags)` instead.
 * Backward-compatible: when `flags` is omitted, returns the default set.
 */
export function tabsForRole(
  role: 'operativo' | 'director',
  flags?: FeatureFlags,
): readonly TabDefinition[] {
  if (role === 'director') return DIRECTOR_TABS;
  if (!flags) {
    // Fallback for callers that haven't been updated to pass flags yet
    return operativoTabs({
      stock: true,
      conversionMateriaPrima: false,
      conversionAutomatica: false,
      auditoriaInventario: false,
      merma: false,
      ventasCredito: false,
    });
  }
  return operativoTabs(flags);
}

// Legacy exports preserved for backward compatibility
export const OPERATIVO_TABS: readonly TabDefinition[] = [
  { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
  { key: 'caja', labelKey: 'tabs.caja', icon: 'landmark', path: '/caja' },
  { key: 'gastos', labelKey: 'tabs.pagos', icon: 'file-text', path: '/egresos' },
  { key: 'productos', labelKey: 'tabs.productos', icon: 'package', path: '/productos' },
  { key: 'otros', labelKey: 'tabs.otros', icon: 'layout-grid', path: '/otros' },
] as const;
