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

interface FlagItem {
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

const OPERATIVO_FLAG_ITEMS: readonly FlagItem[] = [
  {
    item: {
      key: 'productos',
      icon: 'package',
      labelKey: 'otros.productos',
      descriptionKey: 'otros.desc.productos',
      path: '/productos',
    },
    flagCheck: (f) => f.stock && f.merma,
  },
  {
    item: {
      key: 'conversion',
      icon: 'refresh-cw',
      labelKey: 'otros.conversion',
      descriptionKey: 'otros.desc.conversion',
      path: '/conversion',
    },
    flagCheck: (f) => f.conversionMateriaPrima,
  },
  {
    item: {
      key: 'auditoria',
      icon: 'clipboard-list',
      labelKey: 'otros.auditoria',
      descriptionKey: 'otros.desc.auditoria',
      path: '/auditoria',
    },
    flagCheck: (f) => f.auditoriaInventario,
  },
  {
    item: {
      key: 'ventas-credito',
      icon: 'credit-card',
      labelKey: 'otros.ventasCredito',
      descriptionKey: 'otros.desc.ventasCredito',
      path: '/ventas-credito',
    },
    flagCheck: (f) => f.ventasCredito,
  },
] as const;

const DIRECTOR_ALWAYS_ITEMS: readonly OtrosItem[] = [
  {
    key: 'gastos',
    icon: 'file-text',
    labelKey: 'otros.gastos',
    descriptionKey: 'otros.desc.gastos',
    path: '/egresos',
  },
  {
    key: 'indicadores',
    icon: 'trending-up',
    labelKey: 'otros.indicadores',
    descriptionKey: 'otros.desc.indicadores',
    path: '/indicadores',
  },
  {
    key: 'productos',
    icon: 'package',
    labelKey: 'otros.productos',
    descriptionKey: 'otros.desc.productos',
    path: '/productos',
  },
] as const;

const DIRECTOR_FLAG_ITEMS: readonly FlagItem[] = [
  {
    item: {
      key: 'conversion',
      icon: 'refresh-cw',
      labelKey: 'otros.conversion',
      descriptionKey: 'otros.desc.conversion',
      path: '/conversion',
    },
    flagCheck: (f) => f.conversionMateriaPrima,
  },
  {
    item: {
      key: 'auditoria',
      icon: 'clipboard-list',
      labelKey: 'otros.auditoria',
      descriptionKey: 'otros.desc.auditoria',
      path: '/auditoria',
    },
    flagCheck: (f) => f.auditoriaInventario,
  },
  {
    item: {
      key: 'ventas-credito',
      icon: 'credit-card',
      labelKey: 'otros.ventasCredito',
      descriptionKey: 'otros.desc.ventasCredito',
      path: '/ventas-credito',
    },
    flagCheck: (f) => f.ventasCredito,
  },
  {
    item: {
      key: 'merma-reportes',
      icon: 'trending-down',
      labelKey: 'otros.mermaReportes',
      descriptionKey: 'otros.desc.mermaReportes',
      path: '/merma-reportes',
    },
    flagCheck: (f) => f.merma,
  },
] as const;

/** Director caja items always visible (caja is always-on). */
const DIRECTOR_CAJA_ITEMS: readonly OtrosItem[] = [
  {
    key: 'caja-reportes',
    icon: 'inbox',
    labelKey: 'otros.cajaReportes',
    descriptionKey: 'otros.desc.cajaReportes',
    path: '/caja-reportes',
  },
  {
    key: 'cancelaciones',
    icon: 'circle-x',
    labelKey: 'otros.cancelaciones',
    descriptionKey: 'otros.desc.cancelaciones',
    path: '/cancelaciones',
  },
] as const;

const DIRECTOR_TAIL_ITEMS: readonly OtrosItem[] = [
  {
    key: 'empleados',
    icon: 'users',
    labelKey: 'otros.empleados',
    descriptionKey: 'otros.desc.empleados',
    path: '/empleados',
  },
  {
    key: 'usuarios',
    icon: 'user-check',
    labelKey: 'otros.usuarios',
    descriptionKey: 'otros.desc.usuarios',
    path: '/usuarios',
  },
  {
    key: 'configuracion',
    icon: 'settings',
    labelKey: 'otros.configuracion',
    descriptionKey: 'otros.desc.configuracion',
    path: '/settings',
  },
  {
    key: 'funciones',
    icon: 'sliders',
    labelKey: 'otros.funciones',
    descriptionKey: 'otros.desc.funciones',
    path: '/funciones',
  },
] as const;

/** Operativo Otros grid items (always-on + feature-flag dependent). */
export function operativoOtrosItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = OPERATIVO_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  return [...OPERATIVO_ALWAYS_ITEMS, ...flagItems];
}

/** Director Otros grid items (always-on + feature-flag dependent). */
export function directorOtrosItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = DIRECTOR_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  return [...DIRECTOR_ALWAYS_ITEMS, ...flagItems, ...DIRECTOR_CAJA_ITEMS, ...DIRECTOR_TAIL_ITEMS];
}
