/**
 * Tab definitions for the bottom tab bar. The app is single-role (ADR-053):
 * every Operator sees the same bar.
 *
 *   merma OFF (v1):  Ventas | Caja | Gastos | Productos
 *   merma ON:        Ventas | Caja | Gastos | Merma
 *
 * Merma is dark in PLATFORM_AVAILABLE (F-06), so v1 always renders the first
 * row; releasing the flag needs no change here. Caja hosts the shift tools
 * that used to live in "Otros" (ADR-052).
 *
 * "Gastos" is the UI label for the Egresos module (code identifiers stay
 * `expense`/`egreso` — review item #7).
 */

import type { FeatureFlags } from '@xangarro/domain';
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

const VENTAS: TabDefinition = {
  key: 'ventas',
  labelKey: 'tabs.ventas',
  icon: 'dollar-sign',
  path: '/ventas',
};
const CAJA: TabDefinition = { key: 'caja', labelKey: 'tabs.caja', icon: 'landmark', path: '/caja' };
const GASTOS: TabDefinition = {
  key: 'gastos',
  labelKey: 'tabs.gastos',
  icon: 'file-text',
  path: '/egresos',
};
const PRODUCTOS: TabDefinition = {
  key: 'productos',
  labelKey: 'tabs.productos',
  icon: 'package',
  path: '/productos',
};
const MERMA: TabDefinition = {
  key: 'merma',
  labelKey: 'tabs.merma',
  icon: 'trending-down',
  path: '/merma',
};

/** The bottom tabs for the current effective flags. Omitting flags yields the v1 bar. */
export function appTabs(flags?: FeatureFlags): readonly TabDefinition[] {
  return [VENTAS, CAJA, GASTOS, flags?.merma ? MERMA : PRODUCTOS];
}
