/**
 * Drizzle-backed {@link BusinessesRepository}. Follows the same audit +
 * mapping pattern as DrizzleSalesRepository.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type {
  AttrDef,
  BusinessId,
  DeviceId,
  UserId,
  IsoTimestamp,
  SaleCategory,
  TipoNegocio,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type {
  Business,
  BusinessesRepository,
  BusinessPatch,
  NewBusiness,
} from '../businesses-repository.js';
import { businesses } from '../../schema/index.js';
import type { XangarroDatabase } from './_db.js';

type BusinessRow = typeof businesses.$inferSelect;

export class DrizzleBusinessesRepository implements BusinessesRepository {
  readonly #db: XangarroDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: XangarroDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewBusiness): Promise<Business> {
    const id = newEntityId<BusinessId>();
    const ts = now();
    const row = {
      id,
      nombre: input.nombre,
      regimenFiscal: input.regimenFiscal,
      isrTasa: input.isrTasa,
      logoUrl: input.logoUrl ?? null,
      tipoNegocio: input.tipoNegocio ?? 'mixto',
      categoriaVentaPredeterminada: input.categoriaVentaPredeterminada ?? 'Producto',
      atributosProducto: JSON.stringify(input.atributosProducto ?? []),
      featureFlags:
        input.featureFlags ??
        '{"stock":true,"conversionMateriaPrima":false,"conversionAutomatica":false,"auditoriaInventario":false,"merma":false,"ventasCredito":false}',
      businessId: id,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(businesses).values(row).run();
    return this.#mapRow(row as unknown as BusinessRow);
  }

  async findById(id: BusinessId): Promise<Business | null> {
    const row = await this.#db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, id), isNull(businesses.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findCurrent(id: BusinessId): Promise<Business | null> {
    return this.findById(id);
  }

  async update(id: BusinessId, patch: BusinessPatch): Promise<Business> {
    const ts = now();
    // Every patchable column maps 1:1; only the attribute list is stored as
    // JSON. The C-15 branding columns have no SQLite home yet (the app branch
    // adds them); they are dropped here, not written as unknown columns.
    const {
      atributosProducto,
      brandColor: _bc,
      receiptTemplate: _rt,
      receiptLeyenda: _rl,
      addressPrint: _ap,
      whatsapp: _wa,
      direccion: _di,
      socialLinks: _sl,
      ...rest
    } = patch;
    const set: Record<string, unknown> = {
      ...rest,
      ...(atributosProducto === undefined
        ? {}
        : { atributosProducto: JSON.stringify(atributosProducto) }),
      updatedAt: ts,
    };
    await this.#db.update(businesses).set(set).where(eq(businesses.id, id)).run();
    const row = await this.#db.select().from(businesses).where(eq(businesses.id, id)).get();
    if (!row) throw new Error(`Business ${id} not found after update`);
    return this.#mapRow(row);
  }

  async delete(id: BusinessId): Promise<void> {
    const ts = now();
    await this.#db
      .update(businesses)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(businesses.id, id))
      .run();
  }

  #mapRow(row: BusinessRow): Business {
    return {
      id: row.id as BusinessId,
      nombre: row.nombre,
      regimenFiscal: row.regimenFiscal,
      regimenSat: row.regimenSat ?? null,
      rfc: row.rfc ?? null,
      razonSocial: row.razonSocial ?? null,
      codigoPostal: row.codigoPostal ?? null,
      usoCfdi: row.usoCfdi ?? null,
      isrTasa: row.isrTasa,
      logoUrl: row.logoUrl,
      // C-15 defaults until the device columns land (app branch).
      brandColor: null,
      receiptTemplate: 'clasico',
      receiptLeyenda: null,
      addressPrint: false,
      whatsapp: null,
      direccion: null,
      socialLinks: '{}',
      tipoNegocio: (row.tipoNegocio ?? 'mixto') as TipoNegocio,
      categoriaVentaPredeterminada: (row.categoriaVentaPredeterminada ??
        'Producto') as SaleCategory,
      atributosProducto: this.#parseAttrDefs(row.atributosProducto),
      enabledPaymentMethods:
        row.enabledPaymentMethods ?? '["Efectivo","Transferencia","Tarjeta","QR/CoDi"]',
      featureFlags: row.featureFlags,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }

  #parseAttrDefs(raw: string): AttrDef[] {
    try {
      return JSON.parse(raw) as AttrDef[];
    } catch {
      return [];
    }
  }
}
