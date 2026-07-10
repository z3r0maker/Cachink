/**
 * Otros grid items — dynamic based on role + feature flags.
 *
 * Each item represents a shortcut card in the Otros grid screen.
 * Items are filtered based on active feature flags.
 */

import type { FeatureFlags } from '@cachink/domain';
import type { IconName } from '../../components/Icon/index';

export interface OtrosItem {
  readonly key: string;
  readonly icon: IconName;
  readonly labelKey: string;
  readonly descriptionKey?: string;
  readonly path: string;
}

export interface FlagItem {
  readonly item: OtrosItem;
  readonly flagCheck: (f: FeatureFlags) => boolean;
}

// When merma is ON, the Operativo productos tab is replaced with merma,
// so a productos shortcut appears in Otros (requires both stock and merma flags).
/** Operativo items always visible (caja is always-on). */
const OPERATIVO_ALWAYS_ITEMS: readonly OtrosItem[] = [
  {
    key: 'caja',
    icon: 'inbox',
    labelKey: 'otros.caja',
    descriptionKey: 'otros.desc.caja',
    path: '/caja',
  },
  {
    key: 'caja-movimientos',
    icon: 'arrow-down-up',
    labelKey: 'otros.cajaMovimientos',
    descriptionKey: 'otros.desc.cajaMovimientos',
    path: '/caja-movimientos',
  },
  {
    key: 'cancelaciones',
    icon: 'circle-x',
    labelKey: 'otros.cancelaciones',
    descriptionKey: 'otros.desc.cancelaciones',
    path: '/cancelaciones',
  },
] as const;

/**
 * MVP: removed productos, conversion, auditoria, and ventas-credito.
 * Restore hidden entries here when re-enabling post-MVP.
 */
const OPERATIVO_FLAG_ITEMS: readonly FlagItem[] = [
  // ---- Restore post-MVP ----
  // {
  //   item: {
  //     key: 'ventas-credito',
  //     icon: 'credit-card',
  //     labelKey: 'otros.ventasCredito',
  //     descriptionKey: 'otros.desc.ventasCredito',
  //     path: '/ventas-credito',
  //   },
  //   flagCheck: (f) => f.ventasCredito,
  // },
] as const;

/** Operativo Otros grid items (always-on + feature-flag dependent). */
export function operativoOtrosItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = OPERATIVO_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  return [...OPERATIVO_ALWAYS_ITEMS, ...flagItems];
}

export { directorOtrosItems } from './otros-items-director';
