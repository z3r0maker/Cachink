/**
 * In-memory implementation of the SalesRepository contract.
 *
 * Use-case and integration tests inject this instead of the Drizzle
 * implementation so they run without a real database. Both this and the
 * Drizzle version are required by CLAUDE.md §4.3 to pass the same contract
 * test suite (to be added in Phase 1B-M4).
 */

import type { BusinessId, ClientId, DeviceId, IsoTimestamp, SaleId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { NewSale, PaymentState, Sale, SalePatch, SalesRepository } from '@cachink/data';

export class InMemorySalesRepository implements SalesRepository {
  private readonly sales = new Map<SaleId, Sale>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewSale): Promise<Sale> {
    const id = newEntityId<SaleId>();
    const timestamp = now();
    const estadoPago: PaymentState = input.metodo === 'Crédito' ? 'pendiente' : 'pagado';
    const sale: Sale = {
      id,
      fecha: input.fecha,
      concepto: input.concepto,
      categoria: input.categoria,
      monto: input.monto,
      metodo: input.metodo,
      clienteId: input.clienteId ?? null,
      estadoPago,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
    this.sales.set(id, sale);
    return sale;
  }

  async findById(id: SaleId): Promise<Sale | null> {
    const sale = this.sales.get(id);
    if (!sale || sale.deletedAt !== null) return null;
    return sale;
  }

  async findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]> {
    return [...this.sales.values()]
      .filter((s) => s.fecha === date && s.businessId === businessId && s.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly Sale[]> {
    return [...this.sales.values()]
      .filter(
        (s) =>
          s.businessId === businessId && s.deletedAt === null && s.fecha >= from && s.fecha <= to,
      )
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  async findPendingByClient(clientId: ClientId): Promise<readonly Sale[]> {
    return [...this.sales.values()].filter(
      (s) =>
        s.clienteId === clientId &&
        (s.estadoPago === 'pendiente' || s.estadoPago === 'parcial') &&
        s.deletedAt === null,
    );
  }

  async updatePaymentState(id: SaleId, state: PaymentState): Promise<void> {
    const existing = this.sales.get(id);
    if (!existing) return;
    this.sales.set(id, { ...existing, estadoPago: state, updatedAt: now() });
  }

  async update(id: SaleId, patch: SalePatch): Promise<Sale | null> {
    const existing = this.sales.get(id);
    if (!existing || existing.deletedAt !== null) return null;
    const ts: IsoTimestamp = now();
    const next: Sale = {
      ...existing,
      fecha: patch.fecha ?? existing.fecha,
      concepto: patch.concepto ?? existing.concepto,
      categoria: patch.categoria ?? existing.categoria,
      monto: patch.monto ?? existing.monto,
      metodo: patch.metodo ?? existing.metodo,
      clienteId: patch.clienteId ?? existing.clienteId,
      updatedAt: ts,
    };
    this.sales.set(id, next);
    return next;
  }

  async delete(id: SaleId): Promise<void> {
    const existing = this.sales.get(id);
    if (!existing) return;
    const deletedAt: IsoTimestamp = now();
    this.sales.set(id, { ...existing, deletedAt, updatedAt: deletedAt });
  }

  async count(businessId: BusinessId): Promise<number> {
    let n = 0;
    for (const s of this.sales.values()) {
      if (s.businessId === businessId && s.deletedAt === null) n++;
    }
    return n;
  }

  /** Test helper: wipe all sales. Not part of the SalesRepository contract. */
  _reset(): void {
    this.sales.clear();
  }
}
