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
  /** When true, the flag is shown as "Próximamente" and cannot be toggled. */
  readonly comingSoon?: boolean;
}

/**
 * MVP: stock is toggleable. All other flags are shown as "Próximamente"
 * so users know the features exist and are coming.
 */
export const FLAG_DISPLAY_INFO: readonly FlagDisplayInfo[] = [
  {
    key: 'stock',
    icon: 'package',
    labelKey: 'funciones.stock',
    descriptionKey: 'funciones.stockDesc',
  },
  {
    key: 'ventasCredito',
    icon: 'credit-card',
    labelKey: 'funciones.ventasCredito',
    descriptionKey: 'funciones.ventasCreditoDesc',
    comingSoon: true,
  },
  {
    key: 'conversionMateriaPrima',
    icon: 'refresh-cw',
    labelKey: 'funciones.conversion',
    descriptionKey: 'funciones.conversionDesc',
    comingSoon: true,
  },
  {
    key: 'conversionAutomatica',
    icon: 'zap',
    labelKey: 'funciones.conversionAuto',
    descriptionKey: 'funciones.conversionAutoDesc',
    parentKey: 'conversionMateriaPrima',
    comingSoon: true,
  },
  {
    key: 'auditoriaInventario',
    icon: 'clipboard-list',
    labelKey: 'funciones.auditoria',
    descriptionKey: 'funciones.auditoriaDesc',
    comingSoon: true,
  },
  {
    key: 'merma',
    icon: 'trash-2',
    labelKey: 'funciones.merma',
    descriptionKey: 'funciones.mermaDesc',
    comingSoon: true,
  },
] as const;
