/**
 * `useEmitDirectorAlert` — thin mutation hook wrapping
 * `directorAlertsRepository.create()`.
 *
 * Every alert producer calls `emitAlert.mutate(...)` in their
 * `onSuccess` callback. Includes a deduplication guard for sources
 * that fire repeatedly (stock-bajo, credito-vencido).
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { AlertSeverity, AlertSource, BusinessId, DirectorAlert } from '@xangarro/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useTranslation } from '../i18n/index';
import type { NotificationScheduler } from '../notifications/index';
import { useNotificationScheduler } from '../notifications/index';
import { directorAlertKeys } from './query-keys';
import { useEffectiveNotificationPrefs } from './use-notification-prefs';

export interface EmitDirectorAlertInput {
  readonly source: AlertSource;
  readonly severity: AlertSeverity;
  readonly titleKey: string;
  readonly message: string;
  readonly actionRoute: string | null;
  readonly metadata?: string;
  /** Optional key for deduplication — skips emission if an unread alert with the same source + dedupeKey exists. */
  readonly dedupeKey?: string;
}

export type EmitDirectorAlertResult = UseMutationResult<
  DirectorAlert | null,
  Error,
  EmitDirectorAlertInput,
  unknown
>;

/** Severities that fire an OS push notification. `info` stays in-app only. */
const PUSH_SEVERITIES: ReadonlySet<AlertSeverity> = new Set(['critical', 'warning']);

export interface UseEmitDirectorAlertOptions {
  /** Test override — inject an InMemoryNotificationScheduler. */
  readonly testScheduler?: NotificationScheduler;
}

interface EmitDeps {
  readonly repo: ReturnType<typeof useDirectorAlertsRepository>;
  readonly businessId: BusinessId;
  readonly scheduler: NotificationScheduler;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

/** Fire the OS push for critical/warning alerts; `info` stays in-app only. Never throws. */
async function pushIfNeeded(
  deps: EmitDeps,
  alert: DirectorAlert,
  input: EmitDirectorAlertInput,
): Promise<void> {
  if (!PUSH_SEVERITIES.has(input.severity)) return;
  try {
    const permission = await deps.scheduler.requestPermission();
    if (permission !== 'granted') return;
    await deps.scheduler.presentNow({
      id: alert.id,
      title: deps.t(input.titleKey as never),
      body: input.message,
      payload: { actionRoute: input.actionRoute ?? '/notificaciones', alertId: alert.id },
    });
  } catch {
    // Permission denied or notification API unavailable — the alert still
    // lands in the in-app inbox; silently skip the push.
  }
}

/** Deduplication guard + create + push. Returns null when suppressed. */
async function emitDirectorAlert(
  deps: EmitDeps,
  input: EmitDirectorAlertInput,
): Promise<DirectorAlert | null> {
  if (input.dedupeKey) {
    const key = input.dedupeKey;
    const unread = await deps.repo.findUnread(deps.businessId);
    if (unread.some((a) => a.source === input.source && a.metadata.includes(key))) return null;
  }
  const alert = await deps.repo.create({
    source: input.source,
    severity: input.severity,
    titleKey: input.titleKey,
    message: input.message,
    actionRoute: input.actionRoute,
    metadata: input.metadata ?? '{}',
    businessId: deps.businessId,
  });
  await pushIfNeeded(deps, alert, input);
  return alert;
}

export function useEmitDirectorAlert(
  options: UseEmitDirectorAlertOptions = {},
): EmitDirectorAlertResult {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  const effectivePrefs = useEffectiveNotificationPrefs();
  const scheduler = useNotificationScheduler(options.testScheduler);
  const { t } = useTranslation();

  return useMutation<DirectorAlert | null, Error, EmitDirectorAlertInput>({
    async mutationFn(input) {
      if (!businessId) return null;
      // Preferences gate: skip if the Director has suppressed this source.
      if (effectivePrefs[input.source] === false) return null;
      return emitDirectorAlert({ repo, businessId: businessId as BusinessId, scheduler, t }, input);
    },
    async onSuccess(result) {
      if (result) {
        await queryClient.invalidateQueries({
          queryKey: directorAlertKeys.unreadCount(businessId as BusinessId),
        });
      }
    },
  });
}
