/**
 * Tab definitions for the bottom tab bar — 4 tabs per role always.
 *
 * Phase 4 restructure: Operativo and Director each get exactly 4 tabs.
 * The 4th tab is always "Otros" — a grid of feature-flagged shortcuts.
 *
 * Operativo (merma ON):  Ventas | Gastos | Merma | Otros
 * Operativo (merma OFF): Ventas | Gastos | Productos | Otros
 * Director (always):     Home | Ventas | Estados | Otros
 *
 * The "Egresos" label was renamed to "Gastos" in the UI per Phase 4.
 * Code identifiers stay `expense`/`egreso` — this is purely a label change.
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

/** Operativo tabs — dynamic based on merma flag. Always 4 tabs. */
export function operativoTabs(flags: FeatureFlags): readonly TabDefinition[] {
  const tabs: TabDefinition[] = [
    { key: 'ventas', labelKey: 'tabs.ventas', icon: 'dollar-sign', path: '/ventas' },
    { key: 'gastos', labelKey: 'tabs.gastos', icon: 'file-text', path: '/egresos' },
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
      caja: false,
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
  { key: 'gastos', labelKey: 'tabs.gastos', icon: 'file-text', path: '/egresos' },
  { key: 'productos', labelKey: 'tabs.productos', icon: 'package', path: '/productos' },
  { key: 'otros', labelKey: 'tabs.otros', icon: 'layout-grid', path: '/otros' },
] as const;
