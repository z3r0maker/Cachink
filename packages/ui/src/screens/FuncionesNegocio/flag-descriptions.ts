/**
 * Feature flag display metadata — icons, labels, descriptions.
 *
 * i18n keys and icon mappings for the Funciones del negocio screen.
 */

import type { FeatureFlagKey } from '@cachink/domain';

export interface FlagDisplayInfo {
  readonly key: FeatureFlagKey;
  readonly icon: string;
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly parentKey?: FeatureFlagKey;
}

export const FLAG_DISPLAY_INFO: readonly FlagDisplayInfo[] = [
  {
    key: 'stock',
    icon: 'package',
    labelKey: 'funciones.stock',
    descriptionKey: 'funciones.stockDesc',
  },
  {
    key: 'conversionMateriaPrima',
    icon: 'refresh-cw',
    labelKey: 'funciones.conversion',
    descriptionKey: 'funciones.conversionDesc',
    parentKey: 'stock',
  },
  {
    key: 'conversionAutomatica',
    icon: 'zap',
    labelKey: 'funciones.conversionAuto',
    descriptionKey: 'funciones.conversionAutoDesc',
    parentKey: 'conversionMateriaPrima',
  },
  {
    key: 'caja',
    icon: 'inbox',
    labelKey: 'funciones.caja',
    descriptionKey: 'funciones.cajaDesc',
  },
  {
    key: 'auditoriaInventario',
    icon: 'clipboard-list',
    labelKey: 'funciones.auditoria',
    descriptionKey: 'funciones.auditoriaDesc',
    parentKey: 'stock',
  },
  {
    key: 'merma',
    icon: 'trending-down',
    labelKey: 'funciones.merma',
    descriptionKey: 'funciones.mermaDesc',
    parentKey: 'stock',
  },
  {
    key: 'ventasCredito',
    icon: 'credit-card',
    labelKey: 'funciones.ventasCredito',
    descriptionKey: 'funciones.ventasCreditoDesc',
  },
] as const;
