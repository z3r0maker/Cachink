/**
 * In-memory DirectorAlertsRepository. Phase 11.
 */
import type { AlertSeverity, AlertSource, BusinessId, DeviceId, DirectorAlert, DirectorAlertId, IsoTimestamp } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CreateDirectorAlertInput, DirectorAlertsRepository } from '@cachink/data';

export class InMemoryDirectorAlertsRepository implements DirectorAlertsRepository {
  private readonly rows = new Map<DirectorAlertId, DirectorAlert>();
  private readonly deviceId: DeviceId;
  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) { this.deviceId = deviceId; }

  async create(input: CreateDirectorAlertInput): Promise<DirectorAlert> {
    const id = newEntityId<DirectorAlertId>(); const ts = now();
    const row: DirectorAlert = {
      id, source: input.source as AlertSource, severity: input.severity as AlertSeverity,
      titleKey: input.titleKey, message: input.message,
      read: false, actionRoute: input.actionRoute, metadata: input.metadata ?? '{}',
      businessId: input.businessId, deviceId: this.deviceId,
      createdByUserId: null, createdAt: ts, updatedAt: ts, deletedAt: null,
    };
    this.rows.set(id, row); return row;
  }
  async findById(id: DirectorAlertId): Promise<DirectorAlert | null> {
    const r = this.rows.get(id); return r && !r.deletedAt ? r : null;
  }
  async findUnread(businessId: BusinessId): Promise<readonly DirectorAlert[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.read && !r.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async findAll(businessId: BusinessId): Promise<readonly DirectorAlert[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async markRead(id: DirectorAlertId): Promise<void> {
    const r = this.rows.get(id); if (!r) return;
    this.rows.set(id, { ...r, read: true, updatedAt: now() as IsoTimestamp });
  }
  async markAllRead(businessId: BusinessId): Promise<void> {
    for (const [id, r] of this.rows.entries()) {
      if (r.businessId === businessId && !r.read) {
        this.rows.set(id, { ...r, read: true, updatedAt: now() as IsoTimestamp });
      }
    }
  }
}
