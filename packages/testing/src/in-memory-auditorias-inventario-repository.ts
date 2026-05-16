/**
 * In-memory AuditoriasInventarioRepository. Phase 10.
 */
import type { AuditoriaEstado, AuditoriaInventario, AuditoriaInventarioId, BusinessId, DeviceId, IsoDate, IsoTimestamp } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { AuditoriaPatch, AuditoriasInventarioRepository, CreateAuditoriaInput } from '@cachink/data';

export class InMemoryAuditoriasInventarioRepository implements AuditoriasInventarioRepository {
  private readonly rows = new Map<AuditoriaInventarioId, AuditoriaInventario>();
  private readonly deviceId: DeviceId;
  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) { this.deviceId = deviceId; }

  async create(input: CreateAuditoriaInput): Promise<AuditoriaInventario> {
    const id = newEntityId<AuditoriaInventarioId>(); const ts = now();
    const row: AuditoriaInventario = {
      id, fecha: input.fecha as IsoDate, estado: 'borrador' as AuditoriaEstado,
      lineas: input.lineas, totalDiscrepancias: 0,
      totalProductos: input.totalProductos, productosContados: 0,
      businessId: input.businessId, deviceId: this.deviceId,
      createdByUserId: null, createdAt: ts, updatedAt: ts, deletedAt: null,
    };
    this.rows.set(id, row); return row;
  }
  async findById(id: AuditoriaInventarioId): Promise<AuditoriaInventario | null> {
    const r = this.rows.get(id); return r && !r.deletedAt ? r : null;
  }
  async findLatest(businessId: BusinessId): Promise<AuditoriaInventario | null> {
    const rows = [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows[0] ?? null;
  }
  async findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly AuditoriaInventario[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt && r.fecha >= from && r.fecha <= to)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async update(id: AuditoriaInventarioId, patch: AuditoriaPatch): Promise<AuditoriaInventario> {
    const existing = this.rows.get(id);
    if (!existing) throw new Error(`Auditoria ${id} not found`);
    const ts = now() as IsoTimestamp;
    const updated: AuditoriaInventario = {
      ...existing,
      ...(patch.estado !== undefined && { estado: patch.estado }),
      ...(patch.lineas !== undefined && { lineas: patch.lineas }),
      ...(patch.totalDiscrepancias !== undefined && { totalDiscrepancias: patch.totalDiscrepancias }),
      ...(patch.productosContados !== undefined && { productosContados: patch.productosContados }),
      updatedAt: ts,
    };
    this.rows.set(id, updated); return updated;
  }
}
