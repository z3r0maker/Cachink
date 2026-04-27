/**
 * `useScheduleStockLowCheck` — schedules a daily 19:00 local trigger
 * for Director users that fires a stock-low notification when any
 * producto has `stock ≤ umbralStockBajo` (P1C-M11-T02, S4-C11).
 *
 * Behaviour:
 *   - Only active when `role === 'director'` + `enabled === true`.
 *   - Scheduler id is `'stock-low-check'`; re-schedules are idempotent.
 *   - Unmount cancels the scheduled trigger.
 *
 * The notification payload uses i18n keys so callers can re-render the
 * scheduled body after locale changes (rare — Phase 1 ships es-MX only,
 * but we respect CLAUDE.md §8.5 from the start).
 */

import { useEffect } from 'react';
import type { NotificationScheduler } from '../notifications/index';
import { useNotificationScheduler } from '../notifications/index';
import { countBajoStock } from '../screens/Inventario/stock-bajo-banner';
import { useTranslation } from '../i18n/index';
import { useRole } from '../app-config/index';
import { useProductosConStock } from './use-productos-con-stock';

export const STOCK_LOW_NOTIFICATION_ID = 'stock-low-check' as const;

export interface UseScheduleStockLowCheckOptions {
  readonly enabled?: boolean;
  /** Test override — skip the real platform-picker. */
  readonly testScheduler?: NotificationScheduler;
}

export function useScheduleStockLowCheck(options: UseScheduleStockLowCheckOptions = {}): void {
  const { t } = useTranslation();
  const role = useRole();
  const scheduler = useNotificationScheduler(options.testScheduler);
  const productosQ = useProductosConStock();
  const enabled = options.enabled ?? true;

  useEffect(() => {
    const active = enabled && role === 'director';
    if (!active) {
      void scheduler.cancelById(STOCK_LOW_NOTIFICATION_ID);
      return;
    }
    const count = countBajoStock(productosQ.data ?? []);
    if (count === 0) {
      // Cancel any prior schedule so the Director doesn't get a stale
      // notification on a day where stock is healthy.
      void scheduler.cancelById(STOCK_LOW_NOTIFICATION_ID);
      return;
    }
    const body =
      count === 1
        ? t('notifications.stockLowBodyOne')
        : t('notifications.stockLowBodyMany', { count });
    void scheduler.scheduleDaily({
      id: STOCK_LOW_NOTIFICATION_ID,
      hour: 19,
      minute: 0,
      title: t('notifications.stockLowTitle'),
      body,
      payload: { count },
    });
    return () => {
      void scheduler.cancelById(STOCK_LOW_NOTIFICATION_ID);
    };
  }, [enabled, role, scheduler, productosQ.data, t]);
}
