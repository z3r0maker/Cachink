/**
 * `useUnreadAlertCount` — query hook returning the number of unread
 * Director alerts. Powers the NotificationBadge on Director Home.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { filterAlertsByFlags, type BusinessId } from '@cachink/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { directorAlertKeys } from './query-keys';
import { useFeatureFlags } from './use-feature-flags';

export function useUnreadAlertCount(): UseQueryResult<number, Error> {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const flags = useFeatureFlags();

  return useQuery<number, Error>({
    // Include flags in the query key so toggling a flag recounts the badge
    queryKey: [...directorAlertKeys.unreadCount(businessId as BusinessId), flags],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return 0;
      const unread = await repo.findUnread(businessId as BusinessId);
      return filterAlertsByFlags(unread, flags).length;
    },
    /** Auto-refresh every 30s so badge updates while Director stays on Home. */
    refetchInterval: 30_000,
  });
}
