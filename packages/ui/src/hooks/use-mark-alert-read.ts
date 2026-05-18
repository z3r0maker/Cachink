/**
 * `useMarkAlertRead` + `useMarkAllAlertsRead` — mutation hooks
 * that mark Director alerts as read and invalidate the unread count.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, DirectorAlertId } from '@cachink/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { directorAlertKeys } from './query-keys';

export type MarkAlertReadResult = UseMutationResult<void, Error, DirectorAlertId, unknown>;

export function useMarkAlertRead(): MarkAlertReadResult {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();

  return useMutation<void, Error, DirectorAlertId>({
    async mutationFn(id) {
      await repo.markRead(id);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: directorAlertKeys.unreadCount(businessId as BusinessId),
        }),
        queryClient.invalidateQueries({
          queryKey: directorAlertKeys.all(businessId as BusinessId),
        }),
      ]);
    },
  });
}

export type MarkAllAlertsReadResult = UseMutationResult<void, Error, void, unknown>;

export function useMarkAllAlertsRead(): MarkAllAlertsReadResult {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    async mutationFn() {
      if (!businessId) return;
      await repo.markAllRead(businessId as BusinessId);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: directorAlertKeys.unreadCount(businessId as BusinessId),
        }),
        queryClient.invalidateQueries({
          queryKey: directorAlertKeys.all(businessId as BusinessId),
        }),
      ]);
    },
  });
}
