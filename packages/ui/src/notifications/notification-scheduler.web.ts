/**
 * NotificationScheduler — Tauri `@tauri-apps/plugin-notification` impl
 * (ADR-026, S4-C10). Vite resolves this file on desktop.
 *
 * The Tauri plugin only fires immediately (or at an absolute timestamp
 * via its scheduling extension). To honour `scheduleDaily(hour, minute)`
 * semantics we set a `setTimeout` to the next occurrence, fire the
 * notification, and reschedule.
 *
 * The next-fire timestamp is held in memory; persistence lives at the
 * consumer layer (AppConfig → C12 hook) so a cold-start restores it.
 */

import type * as TauriNotificationModule from '@tauri-apps/plugin-notification';
import type {
  NotificationPermission,
  NotificationScheduler,
  NotificationSchedulerOptions,
} from './notification-scheduler.shared';

type TauriNotification = typeof TauriNotificationModule;

async function loadTauriNotification(): Promise<TauriNotification | null> {
  try {
    return await import('@tauri-apps/plugin-notification');
  } catch {
    return null;
  }
}

function millisUntilNextTrigger(hour: number, minute: number, now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

export class TauriNotificationScheduler implements NotificationScheduler {
  readonly #timers = new Map<string, ReturnType<typeof setTimeout>>();

  async requestPermission(): Promise<NotificationPermission> {
    const plugin = await loadTauriNotification();
    if (!plugin) return 'undetermined';
    const granted = await plugin.isPermissionGranted();
    if (granted) return 'granted';
    const requested = await plugin.requestPermission();
    if (requested === 'granted') return 'granted';
    if (requested === 'denied') return 'denied';
    return 'undetermined';
  }

  async scheduleDaily(options: NotificationSchedulerOptions): Promise<void> {
    await this.cancelById(options.id);
    const tick = async (): Promise<void> => {
      const plugin = await loadTauriNotification();
      if (!plugin) return;
      await plugin.sendNotification({
        title: options.title,
        body: options.body,
      });
      // Reschedule for the next day.
      const nextDelay = millisUntilNextTrigger(options.hour, options.minute);
      const timer = setTimeout(() => {
        void tick();
      }, nextDelay);
      this.#timers.set(options.id, timer);
    };
    const initialDelay = millisUntilNextTrigger(options.hour, options.minute);
    const timer = setTimeout(() => {
      void tick();
    }, initialDelay);
    this.#timers.set(options.id, timer);
  }

  async cancelById(id: string): Promise<void> {
    const timer = this.#timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.#timers.delete(id);
    }
  }

  async cancelAll(): Promise<void> {
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
  }
}

// Exposed so C11's useScheduleStockLowCheck can unit-test the next-fire
// calculation without a timer.
export { millisUntilNextTrigger };
