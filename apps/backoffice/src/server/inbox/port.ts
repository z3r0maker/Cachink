/**
 * The inbox's repository port (N-08). The use cases in this folder depend on
 * this interface only; `memory.ts` implements it for tests and
 * `../db/support-items.ts` for Postgres. Both must honour the same contract:
 *
 * - `insertIfAbsent` is atomic on `(source, sourceRef)`: when a row with that
 *   key exists it is returned untouched with `created: false`.
 * - `list` orders by `createdAt` desc, then `id` desc, applies every filter
 *   that is set, starts strictly after `after`, and returns at most `limit`.
 */
import type {
  BusinessId,
  StaffMemberId,
  SupportItem,
  SupportItemId,
  SupportKind,
  SupportStatus,
} from '@xangarro/domain';

/** A keyset position: the last row of the previous page. */
export interface ListCursor {
  readonly createdAt: string;
  readonly id: SupportItemId;
}

export interface SupportItemQuery {
  readonly kinds?: readonly SupportKind[];
  readonly statuses?: readonly SupportStatus[];
  readonly urgent?: boolean;
  readonly ownerStaffId?: StaffMemberId;
  readonly businessId?: BusinessId;
  readonly after: ListCursor | null;
  readonly limit: number;
}

export interface SupportItemRepository {
  findById(id: SupportItemId): Promise<SupportItem | null>;
  insertIfAbsent(item: SupportItem): Promise<{ item: SupportItem; created: boolean }>;
  update(item: SupportItem): Promise<void>;
  list(query: SupportItemQuery): Promise<SupportItem[]>;
  /**
   * What the daily digest reads: items created at or after `since`, plus every
   * open item that is urgent or a factura, whenever it was created.
   */
  listForDigest(since: string): Promise<SupportItem[]>;
}
