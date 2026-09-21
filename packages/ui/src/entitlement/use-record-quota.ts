/**
 * useRecordQuota — the plan's monthly record limit as a `RecordQuota` for the
 * capture use cases (A-10). The month is the server-anchored one, so moving
 * the phone's date does not reset the count. While the entitlement is still
 * loading the quota does not block (a paid plan must never be refused by a
 * race); every capture after that is checked.
 */

import { useMemo } from 'react';
import { PlanRecordQuota, UNLIMITED_QUOTA, type RecordQuota } from '@xangarro/application';
import { useCurrentBusinessId } from '../app-config/index';
import { useRecordUsageRepository } from '../app/repository-provider';
import { useEntitlement } from './use-entitlement';

function localYearMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useRecordQuota(): RecordQuota {
  const usage = useRecordUsageRepository();
  const businessId = useCurrentBusinessId();
  const entitlement = useEntitlement();
  return useMemo(() => {
    if (!entitlement || !businessId) return UNLIMITED_QUOTA;
    return new PlanRecordQuota({
      usage,
      businessId,
      plan: entitlement.plan,
      transactionsPerMonth: entitlement.transactionsPerMonth,
      yearMonth: localYearMonth(entitlement.nowAnchored),
    });
  }, [usage, businessId, entitlement]);
}
