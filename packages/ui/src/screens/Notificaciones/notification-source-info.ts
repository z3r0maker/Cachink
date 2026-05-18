/**
 * Notification source display metadata — icons, labels, descriptions,
 * categories, and feature-flag dependencies.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { AlertSeverity, AlertSource, FeatureFlagKey } from '@cachink/domain';
import type { IconName } from '../../components/Icon/index';

export type NotificationCategory = 'caja' | 'inventario' | 'credito' | 'sistema';

export interface NotificationSourceInfo {
  readonly source: AlertSource;
  readonly icon: IconName;
  readonly labelKey: string;
  readonly descriptionKey: string;
  readonly category: NotificationCategory;
  readonly featureFlag: FeatureFlagKey | null;
  /** Default/most-common severity emitted by this source. */
  readonly defaultSeverity: AlertSeverity;
}

export const NOTIFICATION_SOURCE_INFO: readonly NotificationSourceInfo[] = [
  // ── Caja ──
  {
    source: 'caja-discrepancia',
    icon: 'triangle-alert',
    labelKey: 'notificaciones.cajaDiscrepancia',
    descriptionKey: 'notificaciones.descCajaDiscrepancia',
    category: 'caja',
    featureFlag: null,
    defaultSeverity: 'warning',
  },
  {
    source: 'caja-egreso-auto',
    icon: 'receipt',
    labelKey: 'notificaciones.cajaEgresoAuto',
    descriptionKey: 'notificaciones.descCajaEgresoAuto',
    category: 'caja',
    featureFlag: null,
    defaultSeverity: 'info',
  },
  // ── Inventario ──
  {
    source: 'stock-bajo',
    icon: 'package',
    labelKey: 'notificaciones.stockBajo',
    descriptionKey: 'notificaciones.descStockBajo',
    category: 'inventario',
    featureFlag: 'stock',
    defaultSeverity: 'warning',
  },
  {
    source: 'merma-threshold',
    icon: 'trending-down',
    labelKey: 'notificaciones.mermaThreshold',
    descriptionKey: 'notificaciones.descMermaThreshold',
    category: 'inventario',
    featureFlag: 'merma',
    defaultSeverity: 'warning',
  },
  {
    source: 'auditoria-pendiente',
    icon: 'clipboard-list',
    labelKey: 'notificaciones.auditoriaPendiente',
    descriptionKey: 'notificaciones.descAuditoriaPendiente',
    category: 'inventario',
    featureFlag: 'auditoriaInventario',
    defaultSeverity: 'info',
  },
  {
    source: 'auditoria-discrepancia',
    icon: 'clipboard-list',
    labelKey: 'notificaciones.auditoriaDiscrepancia',
    descriptionKey: 'notificaciones.descAuditoriaDiscrepancia',
    category: 'inventario',
    featureFlag: 'auditoriaInventario',
    defaultSeverity: 'warning',
  },
  {
    source: 'conversion-automatica',
    icon: 'refresh-cw',
    labelKey: 'notificaciones.conversionAutomatica',
    descriptionKey: 'notificaciones.descConversionAutomatica',
    category: 'inventario',
    featureFlag: 'conversionMateriaPrima',
    defaultSeverity: 'info',
  },
  {
    source: 'conversion-costo',
    icon: 'refresh-cw',
    labelKey: 'notificaciones.conversionCosto',
    descriptionKey: 'notificaciones.descConversionCosto',
    category: 'inventario',
    featureFlag: 'conversionMateriaPrima',
    defaultSeverity: 'warning',
  },
  // ── Crédito ──
  {
    source: 'credito-entrega',
    icon: 'credit-card',
    labelKey: 'notificaciones.creditoEntrega',
    descriptionKey: 'notificaciones.descCreditoEntrega',
    category: 'credito',
    featureFlag: 'ventasCredito',
    defaultSeverity: 'info',
  },
  {
    source: 'credito-vencido',
    icon: 'circle-alert',
    labelKey: 'notificaciones.creditoVencido',
    descriptionKey: 'notificaciones.descCreditoVencido',
    category: 'credito',
    featureFlag: 'ventasCredito',
    defaultSeverity: 'critical',
  },
  // ── Sistema ──
  {
    source: 'usuario-cambio',
    icon: 'user-check',
    labelKey: 'notificaciones.usuarioCambio',
    descriptionKey: 'notificaciones.descUsuarioCambio',
    category: 'sistema',
    featureFlag: null,
    defaultSeverity: 'info',
  },
  {
    source: 'feature-flag-cambio',
    icon: 'sliders',
    labelKey: 'notificaciones.featureFlagCambio',
    descriptionKey: 'notificaciones.descFeatureFlagCambio',
    category: 'sistema',
    featureFlag: null,
    defaultSeverity: 'info',
  },
  {
    source: 'gasto-recurrente-pendiente',
    icon: 'receipt',
    labelKey: 'notificaciones.gastoRecurrentePendiente',
    descriptionKey: 'notificaciones.descGastoRecurrente',
    category: 'sistema',
    featureFlag: null,
    defaultSeverity: 'info',
  },
] as const;

/** Ordered list of category keys for section rendering. */
export const NOTIFICATION_CATEGORIES: readonly {
  key: NotificationCategory;
  labelKey: string;
}[] = [
  { key: 'caja', labelKey: 'notificaciones.categoryCaja' },
  { key: 'inventario', labelKey: 'notificaciones.categoryInventario' },
  { key: 'credito', labelKey: 'notificaciones.categoryCredito' },
  { key: 'sistema', labelKey: 'notificaciones.categorySistema' },
] as const;
