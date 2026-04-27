/**
 * Public surface of `@cachink/ui/notifications`.
 *
 * Consumers import one name regardless of platform. Metro / Vite pick
 * the `.native.ts` / `.web.ts` variant. See ADR-026.
 */

export {
  InMemoryNotificationScheduler,
  type NotificationScheduler,
  type NotificationPermission,
  type NotificationSchedulerOptions,
} from './notification-scheduler.shared';
export { useNotificationScheduler, __resetSchedulerSingleton } from './use-notification-scheduler';
