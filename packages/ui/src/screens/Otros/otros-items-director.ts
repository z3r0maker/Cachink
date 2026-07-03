/**
 * Director Otros grid items — always-on + feature-flag dependent.
 *
 * Extracted from otros-items.ts to keep each file under 200 lines.
 */

import type { FeatureFlags } from '@cachink/domain';
import type { OtrosItem, FlagItem } from './otros-items';

const DIRECTOR_ALWAYS_ITEMS: readonly OtrosItem[] = [
  {
    key: 'notificaciones',
    icon: 'bell',
    labelKey: 'otros.notificaciones',
    descriptionKey: 'otros.desc.notificaciones',
    path: '/notificaciones',
  },
  {
    key: 'gastos',
    icon: 'file-text',
    labelKey: 'otros.gastos',
    descriptionKey: 'otros.desc.gastos',
    path: '/gastos',
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
    path: '/productos-otros',
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

const DIRECTOR_CAJA_ITEMS: readonly OtrosItem[] = [
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
    key: 'caja-reportes',
    icon: 'chart-bar',
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

export function directorOtrosItems(flags: FeatureFlags): OtrosItem[] {
  const flagItems = DIRECTOR_FLAG_ITEMS.filter((e) => e.flagCheck(flags)).map((e) => e.item);
  const items = [
    ...DIRECTOR_ALWAYS_ITEMS,
    ...flagItems,
    ...DIRECTOR_CAJA_ITEMS,
    ...DIRECTOR_TAIL_ITEMS,
  ];

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    items.push({
      key: 'telemetria',
      icon: 'zap',
      labelKey: 'otros.telemetria',
      descriptionKey: 'otros.desc.telemetria',
      path: '/telemetria',
    });
  }

  return items;
}
