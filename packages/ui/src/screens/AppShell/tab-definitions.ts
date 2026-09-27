/**
 * Tab definitions for the bottom tab bar. The app is single-role (ADR-053):
 * every Operator sees the same bar: Ventas | Caja | Gastos | Productos.
 *
 * The phone is only the operator's register: merma is an inventory
 * movement (Salida · «Merma / daño»), not a tab. Caja hosts the shift tools
 * that used to live in "Otros" (ADR-052).
 *
 * "Gastos" is the UI label for the Egresos module (code identifiers stay
 * `expense`/`egreso` — review item #7).
 */

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
/** The register's bottom tabs. */
export function appTabs(): readonly TabDefinition[] {
  return [VENTAS, CAJA, GASTOS, PRODUCTOS];
}
