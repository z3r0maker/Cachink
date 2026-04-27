/**
 * NotificationScheduler — shared types + InMemoryNotificationScheduler
 * (no platform extension).
 *
 * Lives separately from `./notification-scheduler.ts` so consumers
 * (`use-notification-scheduler.ts`, `notifications/index.ts`, the
 * `.native.ts` / `.web.ts` platform variants) can import the contract
 * without Metro/Vite resolving back to a platform-extension file that
 * shadows the base. Importing `InMemoryNotificationScheduler` from
 * `'./notification-scheduler'` on iOS resolves to
 * `notification-scheduler.native.ts` (Metro picks `.native.ts` over
 * the bare `.ts`), and that file only exports
 * `ExpoNotificationScheduler` — so the import resolves to `undefined`
 * and `new InMemoryNotificationScheduler()` crashes with "Cannot read
 * property 'prototype' of undefined". Routing the shared exports
 * through this `*.shared.ts` file is the canonical Metro
 * platform-extension fix (matches the icon / database-backup /
 * rasterize pattern).
 */

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationSchedulerOptions {
  readonly id: string;
  readonly hour: number;
  readonly minute: number;
  readonly title: string;
  readonly body: string;
  readonly payload?: Record<string, unknown>;
}

export interface NotificationScheduler {
  requestPermission(): Promise<NotificationPermission>;
  scheduleDaily(options: NotificationSchedulerOptions): Promise<void>;
  cancelById(id: string): Promise<void>;
  cancelAll(): Promise<void>;
}

/**
 * Default no-op scheduler used by tests and by mobile preview builds
 * that don't want to fire real local notifications. Acts as the test
 * fixture when wired into the `useNotificationScheduler` hook via
 * override.
 */
export class InMemoryNotificationScheduler implements NotificationScheduler {
  readonly #scheduled = new Map<string, NotificationSchedulerOptions>();
  #permission: NotificationPermission = 'undetermined';

  setPermission(next: NotificationPermission): void {
    this.#permission = next;
  }

  get scheduled(): ReadonlyMap<string, NotificationSchedulerOptions> {
    return this.#scheduled;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (this.#permission === 'undetermined') this.#permission = 'granted';
    return this.#permission;
  }

  async scheduleDaily(options: NotificationSchedulerOptions): Promise<void> {
    this.#scheduled.set(options.id, options);
  }

  async cancelById(id: string): Promise<void> {
    this.#scheduled.delete(id);
  }

  async cancelAll(): Promise<void> {
    this.#scheduled.clear();
  }
}
