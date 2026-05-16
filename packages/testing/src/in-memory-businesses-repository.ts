/**
 * In-memory implementation of {@link BusinessesRepository}. Used by
 * use-case tests and the shared contract suite.
 */

import type { BusinessId, DeviceId, IsoTimestamp } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Business, BusinessesRepository, BusinessPatch, NewBusiness } from '@cachink/data';

export class InMemoryBusinessesRepository implements BusinessesRepository {
  private readonly rows = new Map<BusinessId, Business>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewBusiness): Promise<Business> {
    const id = newEntityId<BusinessId>();
    const ts = now();
    const row: Business = {
      id,
      nombre: input.nombre,
      regimenFiscal: input.regimenFiscal,
      isrTasa: input.isrTasa,
      logoUrl: input.logoUrl ?? null,
      tipoNegocio: input.tipoNegocio ?? 'mixto',
      categoriaVentaPredeterminada: input.categoriaVentaPredeterminada ?? 'Producto',
      atributosProducto: input.atributosProducto ?? [],
      enabledPaymentMethods: input.enabledPaymentMethods ?? '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
      featureFlags: input.featureFlags ?? '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
      businessId: id,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: BusinessId): Promise<Business | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findCurrent(id: BusinessId): Promise<Business | null> {
    return this.findById(id);
  }

  async update(id: BusinessId, patch: BusinessPatch): Promise<Business> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Business ${id} not found`);
    }
    const ts = now();
    const updated: Business = {
      ...existing,
      ...(patch.nombre !== undefined && { nombre: patch.nombre }),
      ...(patch.regimenFiscal !== undefined && { regimenFiscal: patch.regimenFiscal }),
      ...(patch.isrTasa !== undefined && { isrTasa: patch.isrTasa }),
      ...(patch.featureFlags !== undefined && { featureFlags: patch.featureFlags }),
      ...(patch.enabledPaymentMethods !== undefined && { enabledPaymentMethods: patch.enabledPaymentMethods }),
      updatedAt: ts,
    };
    this.rows.set(id, updated);
    return updated;
  }

  async delete(id: BusinessId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
