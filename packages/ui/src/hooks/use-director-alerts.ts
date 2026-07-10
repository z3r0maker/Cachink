/**
 * `useDirectorAlerts` — query hook returning the full list of Director
 * alerts (all or unread only). Powers the Notificaciones screen.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { filterAlertsByFlags, type BusinessId, type DirectorAlert } from '@cachink/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { directorAlertKeys } from './query-keys';
import { useFeatureFlags } from './use-feature-flags';

export type AlertFilter = 'all' | 'unread';

export function useDirectorAlerts(
  filter: AlertFilter = 'all',
): UseQueryResult<readonly DirectorAlert[], Error> {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();
  const flags = useFeatureFlags();

  return useQuery<readonly DirectorAlert[], Error>({
    // Include flags in the query key so toggling a flag refreshes the list
    queryKey: [...directorAlertKeys.list(businessId as BusinessId, filter), flags],
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const bid = businessId as BusinessId;
      const raw = filter === 'unread' ? await repo.findUnread(bid) : await repo.findAll(bid);
      return filterAlertsByFlags(raw, flags);
    },
  });
}
