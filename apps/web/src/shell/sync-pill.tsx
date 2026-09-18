import { StatusPill } from '@/components';

import { syncPillState } from './sync-state';

export interface SyncPillProps {
  /** Rows captured on a device and not yet accepted by the server. */
  readonly pending: number;
}

export function SyncPill({ pending }: SyncPillProps) {
  const { tone, label } = syncPillState(pending);
  return <StatusPill tone={tone}>{label}</StatusPill>;
}
