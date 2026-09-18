import type { SupportItem } from '@xangarro/domain';

/**
 * Port: tell a human, right now, that an urgent inbox item exists (N-10,
 * decision row 4). `createSupportItem` calls it once, when an urgent item is
 * first filed. Implementations throw on failure; the caller logs and carries
 * on — the item is already in the inbox and in tomorrow's digest.
 */
export interface UrgentNotifier {
  notifyUrgent(item: SupportItem): Promise<void>;
}
