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
  readonly path: string;
}

interface FlagItem {
  readonly item: OtrosItem;
  readonly flagCheck: (f: FeatureFlags) => boolean;
}

// When merma is ON, the Operativo productos tab is replaced with merma,
// so a productos shortcut appears in Otros (requires both stock and merma flags).
const OPERATIVO_FLAG_ITEMS: readonly FlagItem[] = [
  {
    item: { key: 'productos', icon: 'package', labelKey: 'otros.productos', path: '/productos' },
    flagCheck: (f) => f.stock && f.merma,
  },
  {
    item: {
      key: 'conversion',
      icon: 'refresh-cw',
      labelKey: 'otros.conversion',
      path: '/conversion',
    },
    flagCheck: (f) => f.conversionMateriaPrima,
  },
  {
    item: {
      key: 'auditoria',
      icon: 'clipboard-list',
      labelKey: 'otros.auditoria',
      path: '/auditoria',
    },
    flagCheck: (f) => f.auditoriaInventario,
  },
  {
    item: {
      key: 'ventas-credito',
      icon: 'credit-card',
      labelKey: 'otros.ventasCredito',
      path: '/ventas-credito',
    },
    flagCheck: (f) => f.ventasCredito,
  },
  {
    item: { key: 'caja', icon: 'inbox', labelKey: 'otros.caja', path: '/caja' },
    flagCheck: (f) => f.caja,
  },
] as const;

const DIRECTOR_ALWAYS_ITEMS: readonly OtrosItem[] = [
  { key: 'gastos', icon: 'file-text', labelKey: 'otros.gastos', path: '/egresos' },
  { key: 'indicadores', icon: 'trending-up', labelKey: 'otros.indicadores', path: '/indicadores' },
  { key: 'productos', icon: 'package', labelKey: 'otros.productos', path: '/productos' },
] as const;

const DIRECTOR_FLAG_ITEMS: readonly FlagItem[] = [
  {
    item: {
      key: 'conversion',
      icon: 'refresh-cw',
      labelKey: 'otros.conversion',
      path: '/conversion',
    },
    flagCheck: (f) => f.conversionMateriaPrima,
  },
  {
    item: {
      key: 'auditoria',
      icon: 'clipboard-list',
      labelKey: 'otros.auditoria',
      path: '/auditoria',
    },
    flagCheck: (f) => f.auditoriaInventario,
  },
  {
    item: {
      key: 'ventas-credito',
      icon: 'credit-card',
      labelKey: 'otros.ventasCredito',
      path: '/ventas-credito',
    },
    flagCheck: (f) => f.ventasCredito,
  },
  {
    item: {
      key: 'caja-reportes',
      icon: 'inbox',
      labelKey: 'otros.cajaReportes',
      path: '/caja-reportes',
    },
    flagCheck: (f) => f.caja,
  },
  {
    item: {
      key: 'merma-reportes',
      icon: 'trending-down',
      labelKey: 'otros.mermaReportes',
      path: '/merma-reportes',
    },
    flagCheck: (f) => f.merma,
  },
] as const;

const DIRECTOR_TAIL_ITEMS: readonly OtrosItem[] = [
  { key: 'usuarios', icon: 'users', labelKey: 'otros.usuarios', path: '/usuarios' },
  { key: 'configuracion', icon: 'settings', labelKey: 'otros.configuracion', path: '/settings' },
  { key: 'funciones', icon: 'sliders', labelKey: 'otros.funciones', path: '/funciones' },
] as const;

/** Operativo Otros grid items (feature-flag dependent). */
export function operativoOtrosItems(flags: FeatureFlags): OtrosItem[] {
  return OPERATIVO_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
}

/** Director Otros grid items (always-on + feature-flag dependent). */
export function directorOtrosItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = DIRECTOR_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  return [...DIRECTOR_ALWAYS_ITEMS, ...flagItems, ...DIRECTOR_TAIL_ITEMS];
}
