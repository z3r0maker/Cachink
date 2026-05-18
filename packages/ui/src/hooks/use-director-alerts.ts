/**
 * `useDirectorAlerts` — query hook returning the full list of Director
 * alerts (all or unread only). Powers the Notificaciones screen.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { BusinessId, DirectorAlert } from '@cachink/domain';
import { useDirectorAlertsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { directorAlertKeys } from './query-keys';

export type AlertFilter = 'all' | 'unread';

export function useDirectorAlerts(
  filter: AlertFilter = 'all',
): UseQueryResult<readonly DirectorAlert[], Error> {
  const repo = useDirectorAlertsRepository();
  const businessId = useCurrentBusinessId();

  return useQuery<readonly DirectorAlert[], Error>({
    queryKey: directorAlertKeys.list(businessId as BusinessId, filter),
    enabled: businessId !== null,
    async queryFn() {
      if (!businessId) return [];
      const bid = businessId as BusinessId;
      return filter === 'unread' ? repo.findUnread(bid) : repo.findAll(bid);
    },
  });
}
