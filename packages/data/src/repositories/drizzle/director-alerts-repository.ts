/**
 * Drizzle-backed DirectorAlertsRepository. Phase 11.
 */
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { AlertSeverity, AlertSource, BusinessId, DeviceId, DirectorAlert, DirectorAlertId, IsoTimestamp, UserId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CreateDirectorAlertInput, DirectorAlertsRepository } from '../director-alerts-repository.js';
import { directorAlerts } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type Row = typeof directorAlerts.$inferSelect;

export class DrizzleDirectorAlertsRepository implements DirectorAlertsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;
  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db; this.#deviceId = deviceId; this.#userId = userId;
  }

  async create(input: CreateDirectorAlertInput): Promise<DirectorAlert> {
    const id = newEntityId<DirectorAlertId>(); const ts = now();
    const row = {
      id, source: input.source, severity: input.severity,
      titleKey: input.titleKey, message: input.message,
      read: false, actionRoute: input.actionRoute,
      metadata: input.metadata ?? '{}',
      businessId: input.businessId, deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts, updatedAt: ts, deletedAt: null as string | null,
    };
    await this.#db.insert(directorAlerts).values(row).run();
    return this.#map(row as unknown as Row);
  }

  async findById(id: DirectorAlertId): Promise<DirectorAlert | null> {
    const r = await this.#db.select().from(directorAlerts).where(and(eq(directorAlerts.id, id), isNull(directorAlerts.deletedAt))).get();
    return r ? this.#map(r) : null;
  }
  async findUnread(businessId: BusinessId): Promise<readonly DirectorAlert[]> {
    const rows = await this.#db.select().from(directorAlerts)
      .where(and(eq(directorAlerts.businessId, businessId), eq(directorAlerts.read, false), isNull(directorAlerts.deletedAt)))
      .orderBy(desc(directorAlerts.createdAt)).all();
    return rows.map((r) => this.#map(r));
  }
  async findAll(businessId: BusinessId): Promise<readonly DirectorAlert[]> {
    const rows = await this.#db.select().from(directorAlerts)
      .where(and(eq(directorAlerts.businessId, businessId), isNull(directorAlerts.deletedAt)))
      .orderBy(desc(directorAlerts.createdAt)).all();
    return rows.map((r) => this.#map(r));
  }
  async markRead(id: DirectorAlertId): Promise<void> {
    await this.#db.update(directorAlerts).set({ read: true, updatedAt: now() }).where(eq(directorAlerts.id, id)).run();
  }
  async markAllRead(businessId: BusinessId): Promise<void> {
    await this.#db.update(directorAlerts).set({ read: true, updatedAt: now() })
      .where(and(eq(directorAlerts.businessId, businessId), eq(directorAlerts.read, false))).run();
  }

  #map(r: Row): DirectorAlert {
    return {
      id: r.id as DirectorAlertId, source: r.source as AlertSource,
      severity: r.severity as AlertSeverity, titleKey: r.titleKey,
      message: r.message, read: r.read, actionRoute: r.actionRoute ?? null,
      metadata: r.metadata,
      businessId: r.businessId as BusinessId, deviceId: r.deviceId as DeviceId,
      createdByUserId: (r.createdByUserId ?? null) as UserId | null,
      createdAt: r.createdAt as IsoTimestamp, updatedAt: r.updatedAt as IsoTimestamp,
      deletedAt: (r.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
