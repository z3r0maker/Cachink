/**
 * `useScheduleStockLowCheck` — schedules a daily 19:00 local reminder on
 * this device when products that track stock are at or below their
 * threshold (A-13). No role gate: any device with the Dispositivo
 * notifications toggle on and stock on for its plan gets it; the copy
 * speaks to the operator. `stock-low-check` re-schedules idempotently and
 * is cancelled when there is nothing to remind about.
 */

import { useEffect } from 'react';
import { useNotificationsEnabled } from '../app-config/index';
import type { NotificationScheduler } from '../notifications/index';
import { useNotificationScheduler } from '../notifications/index';
import { stockLowCount } from '../notifications/stock-low';
import { useTranslation } from '../i18n/index';
import { useFeatureFlag } from './use-feature-flags';
import { useProductosConStock } from './use-productos-con-stock';

export const STOCK_LOW_NOTIFICATION_ID = 'stock-low-check' as const;

export interface UseScheduleStockLowCheckOptions {
  readonly enabled?: boolean;
  /** Test override — skip the real platform-picker. */
  readonly testScheduler?: NotificationScheduler;
}

export function useScheduleStockLowCheck(options: UseScheduleStockLowCheckOptions = {}): void {
  const { t } = useTranslation();
  const scheduler = useNotificationScheduler(options.testScheduler);
  const productosQ = useProductosConStock();
  const notificationsEnabled = useNotificationsEnabled() && (options.enabled ?? true);
  const stockEnabled = useFeatureFlag('stock');

  useEffect(() => {
    const count = stockLowCount(productosQ.data ?? [], { notificationsEnabled, stockEnabled });
    if (count === 0) {
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
      payload: { count, actionRoute: '/productos' },
    });
  }, [notificationsEnabled, stockEnabled, scheduler, productosQ.data, t]);
}
