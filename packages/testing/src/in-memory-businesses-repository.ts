/**
 * In-memory implementation of {@link BusinessesRepository}. Used by
 * use-case tests and the shared contract suite.
 */

import type { BusinessId, DeviceId, IsoTimestamp } from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { Business, BusinessesRepository, BusinessPatch, NewBusiness } from '@xangarro/data';

/** The C-15 branding fields' storage defaults, mirrored from the schema. */
function brandDefaults(
  input: NewBusiness,
): Pick<
  Business,
  | 'brandColor'
  | 'receiptTemplate'
  | 'receiptLeyenda'
  | 'addressPrint'
  | 'direccion'
  | 'whatsapp'
  | 'socialLinks'
> {
  return {
    brandColor: input.brandColor ?? null,
    receiptTemplate: input.receiptTemplate ?? 'clasico',
    receiptLeyenda: input.receiptLeyenda ?? null,
    addressPrint: input.addressPrint ?? false,
    direccion: input.direccion ?? null,
    whatsapp: input.whatsapp ?? null,
    socialLinks: input.socialLinks ?? '{}',
  };
}

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
      regimenSat: input.regimenSat ?? null,
      rfc: input.rfc ?? null,
      razonSocial: input.razonSocial ?? null,
      codigoPostal: input.codigoPostal ?? null,
      usoCfdi: input.usoCfdi ?? null,
      isrTasa: input.isrTasa,
      logoUrl: input.logoUrl ?? null,
      ...brandDefaults(input),
      tipoNegocio: input.tipoNegocio ?? 'mixto',
      categoriaVentaPredeterminada: input.categoriaVentaPredeterminada ?? 'Producto',
      atributosProducto: input.atributosProducto ?? [],
      enabledPaymentMethods:
        input.enabledPaymentMethods ?? '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
      featureFlags:
        input.featureFlags ??
        '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
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
    // Same contract as the Drizzle repo: every defined key of the patch lands.
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    const updated: Business = { ...existing, ...defined, updatedAt: ts };
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
