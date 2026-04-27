/**
 * NotificationScheduler — shared contract across mobile + desktop
 * (ADR-026, S4-C10).
 *
 * Metro / Vite pick the `.native.ts` / `.web.ts` variant automatically.
 * Feature code imports `NotificationScheduler` + `useNotificationScheduler`
 * from this folder; the right impl is mounted per-platform.
 *
 * Shared types + `InMemoryNotificationScheduler` live in
 * `./notification-scheduler.shared.ts` so consumers don't accidentally
 * resolve them through a platform-extension file that shadows this
 * base. This entry re-exports the shared surface for backwards
 * compatibility — but new code should import from
 * `./notification-scheduler.shared` (or the `notifications/index.ts`
 * barrel) directly.
 *
 * Semantics:
 *   - `requestPermission` is idempotent — safe to call at boot.
 *   - `scheduleDaily` is idempotent by id — calling again replaces.
 *   - `cancelById` / `cancelAll` never throw on "not found".
 */

export type {
  NotificationPermission,
  NotificationScheduler,
  NotificationSchedulerOptions,
} from './notification-scheduler.shared';
export { InMemoryNotificationScheduler } from './notification-scheduler.shared';
