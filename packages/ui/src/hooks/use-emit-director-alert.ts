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
import type { AlertSeverity, AlertSource, BusinessId, DirectorAlert } from '@cachink/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
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

export function useEmitDirectorAlert(): EmitDirectorAlertResult {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  const effectivePrefs = useEffectiveNotificationPrefs();

  return useMutation<DirectorAlert | null, Error, EmitDirectorAlertInput>({
    async mutationFn(input) {
      if (!businessId) return null;

      // Preferences gate: skip if Director has suppressed this source
      if (effectivePrefs[input.source] === false) return null;

      const bid = businessId as BusinessId;

      // Deduplication guard
      if (input.dedupeKey) {
        const unread = await repo.findUnread(bid);
        const duplicate = unread.some(
          (a) => a.source === input.source && a.metadata.includes(input.dedupeKey!),
        );
        if (duplicate) return null;
      }

      return repo.create({
        source: input.source,
        severity: input.severity,
        titleKey: input.titleKey,
        message: input.message,
        actionRoute: input.actionRoute,
        metadata: input.metadata ?? '{}',
        businessId: bid,
      });
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
