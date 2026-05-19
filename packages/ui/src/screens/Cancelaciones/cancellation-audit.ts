/**
 * Cancellation audit helpers — extracted from cancellation-flow.tsx
 * to stay under the 200-line and complexity budgets.
 */

import type { BusinessId, Sale, UserId } from '@cachink/domain';
import type { LogStore } from '@cachink/observability';
import { addAuditBreadcrumb } from '../../observability/sentry-breadcrumbs';

interface AuditContext {
  readonly sale: Sale;
  readonly userId: UserId | null;
  readonly deviceId: string;
  readonly businessId: BusinessId | string;
  readonly motivo: string;
  readonly isCashSale: boolean;
}

export function logSuccessAudit(ctx: AuditContext, logStore: LogStore | null): void {
  const event = {
    id: '',
    timestamp: new Date().toISOString(),
    operation: 'venta.cancelar' as const,
    entityType: 'sale',
    entityId: ctx.sale.id,
    userId: ctx.userId ?? null,
    deviceId: ctx.deviceId ?? '',
    businessId: ctx.businessId ?? '',
    metadata: {
      motivo: ctx.motivo,
      montoOriginalCentavos: String(ctx.sale.monto),
      metodoOriginal: ctx.sale.metodo,
      isCashSale: ctx.isCashSale,
    },
    status: 'success' as const,
  };
  addAuditBreadcrumb(event);
  void logStore?.writeAudit(event).catch(() => {});
}

export function logErrorAudit(ctx: AuditContext, error: Error, logStore: LogStore | null): void {
  const errorEvent = {
    id: '',
    timestamp: new Date().toISOString(),
    operation: 'venta.cancelar' as const,
    entityType: 'sale',
    entityId: ctx.sale.id,
    userId: ctx.userId ?? null,
    deviceId: ctx.deviceId ?? '',
    businessId: ctx.businessId ?? '',
    metadata: { motivo: ctx.motivo },
    status: 'error' as const,
    errorCode: error.name,
    errorMessage: error.message,
  };
  addAuditBreadcrumb(errorEvent);
  void logStore?.writeAudit(errorEvent).catch(() => {});
  void logStore
    ?.writeError({
      id: '',
      timestamp: new Date().toISOString(),
      source: 'ui',
      operation: 'venta.cancelar',
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      userId: ctx.userId ?? null,
      deviceId: ctx.deviceId ?? '',
      businessId: ctx.businessId ?? null,
    })
    .catch(() => {});
}
