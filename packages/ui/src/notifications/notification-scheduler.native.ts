/**
 * NotificationScheduler — Expo `expo-notifications` implementation
 * (ADR-026, S4-C10). Metro resolves this file on iOS / Android.
 */

import * as Notifications from 'expo-notifications';
import type {
  NotificationPermission,
  NotificationScheduler,
  NotificationSchedulerOptions,
} from './notification-scheduler.shared';

function mapStatus(status: string): NotificationPermission {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export class ExpoNotificationScheduler implements NotificationScheduler {
  async requestPermission(): Promise<NotificationPermission> {
    const { status } = await Notifications.requestPermissionsAsync();
    return mapStatus(status);
  }

  async scheduleDaily(options: NotificationSchedulerOptions): Promise<void> {
    await this.cancelById(options.id);
    await Notifications.scheduleNotificationAsync({
      identifier: options.id,
      content: {
        title: options.title,
        body: options.body,
        data: options.payload ?? {},
      },
      trigger: {
        type: 'daily',
        hour: options.hour,
        minute: options.minute,
      } as never,
    });
  }

  async cancelById(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}
