/**
 * `useNotificationPrefs` — reads per-source notification preferences
 * from AppConfig. `useUpdateNotificationPrefs` persists changes.
 * `useEffectiveNotificationPrefs` merges stored prefs with feature-flag locks.
 *
 * Same AppConfig JSON pattern as `useHealthThresholds`.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  NotificationPreferencesSchema,
  deriveDefaultPrefs,
  resolveEffectivePrefs,
  type NotificationPreferences,
} from '@cachink/domain';
import { useAppConfigRepository } from '../app/repository-provider';
import { APP_CONFIG_KEYS } from '../app-config/types';
import { useFeatureFlags } from './use-feature-flags';

/** Query key used by both read and write hooks. */
export const notificationPrefsKey = ['notificationPrefs'] as const;

/**
 * Read stored notification preferences. Falls back to defaults derived
 * from current feature flags when no config exists.
 */
export function useNotificationPrefs() {
  const appConfig = useAppConfigRepository();
  const flags = useFeatureFlags();
  const defaults = deriveDefaultPrefs(flags);

  return useQuery({
    queryKey: notificationPrefsKey,
    async queryFn(): Promise<NotificationPreferences> {
      const raw = await appConfig.get(APP_CONFIG_KEYS.notificationPrefs);
      if (!raw) return defaults;
      const parsed = NotificationPreferencesSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : defaults;
    },
    initialData: defaults,
  });
}

/** Persist updated notification preferences to AppConfig. */
export function useUpdateNotificationPrefs() {
  const appConfig = useAppConfigRepository();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn(next: NotificationPreferences) {
      await appConfig.set(
        APP_CONFIG_KEYS.notificationPrefs,
        JSON.stringify(next),
      );
    },
    async onSuccess() {
      await queryClient.invalidateQueries({
        queryKey: notificationPrefsKey,
      });
    },
  });
}

/**
 * Effective preferences: stored Director overrides merged with
 * feature-flag locks. When a feature is OFF its alerts are forced OFF.
 */
export function useEffectiveNotificationPrefs(): NotificationPreferences {
  const { data: stored } = useNotificationPrefs();
  const flags = useFeatureFlags();
  return resolveEffectivePrefs(stored, flags);
}
