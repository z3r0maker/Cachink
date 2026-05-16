/**
 * RegistrarVentaUseCase — records a Venta.
 *
 * Responsibilities:
 *   1. Re-validate the NewSale input with Zod at the boundary.
 *   2. Enforce the Crédito invariant: clienteId is required AND the
 *      cliente must exist.
 *   3. Validate that the referenced producto exists (ADR-048).
 *   4. Delegate persistence to SalesRepository.create().
 *   5. When stock flag is ON AND the producto has `seguirStock=true`,
 *      auto-create a salida MovimientoInventario with `cantidad` units.
 *
 * Phase 5: `stockEnabled` flag supersedes `tipoNegocio` for stock decisions.
 */

import { NewSaleSchema, today, type CajaTurnoId, type NewSale, type Sale, type UserId } from '@cachink/domain';
import { CajaNoAbiertaError } from '@cachink/domain';
import type {
  CajaTurnosRepository,
  ClientsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface RegistrarVentaConfig {
  /** Business-level stock feature flag. When false, no stock movements. */
  readonly stockEnabled?: boolean;
  /** Current user — needed to look up their open turno. */
  readonly userId: UserId | null;
}

export class RegistrarVentaUseCase implements UseCase<NewSale, Sale> {
  readonly #sales: SalesRepository;
  readonly #clients: ClientsRepository;
  readonly #products: ProductsRepository;
  readonly #movements: InventoryMovementsRepository;
  readonly #cajaTurnos: CajaTurnosRepository;
  readonly #stockEnabled: boolean;
  readonly #userId: UserId | null;

  constructor(
    sales: SalesRepository,
    clients: ClientsRepository,
    products: ProductsRepository,
    movements: InventoryMovementsRepository,
    cajaTurnos: CajaTurnosRepository,
    config: RegistrarVentaConfig,
  ) {
    this.#sales = sales;
    this.#clients = clients;
    this.#products = products;
    this.#movements = movements;
    this.#cajaTurnos = cajaTurnos;
    this.#stockEnabled = config.stockEnabled ?? true;
    this.#userId = config.userId;
  }

  async execute(input: NewSale): Promise<Sale> {
    const parsed = NewSaleSchema.parse(input);

    // ── Caja gate (always active) ──
    if (!this.#userId) {
      throw new CajaNoAbiertaError();
    }
    const turno = await this.#cajaTurnos.findOpenByUser(this.#userId);
    if (!turno) throw new CajaNoAbiertaError();
    const cajaTurnoId: CajaTurnoId = turno.id;

    const producto = await this.#products.findById(parsed.productoId);
    if (!producto) {
      throw new TypeError(`Producto ${parsed.productoId} no existe`);
    }

    if (parsed.metodo === 'Crédito') {
      if (!parsed.clienteId) {
        throw new TypeError('Venta en Crédito requiere clienteId');
      }
      const cliente = await this.#clients.findById(parsed.clienteId);
      if (!cliente) {
        throw new TypeError(`Cliente ${parsed.clienteId} no existe`);
      }
    }

    const hora = parsed.hora ?? (() => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    })();
    const sale = await this.#sales.create({
      ...parsed,
      hora,
      cajaTurnoId,
      efectivoRecibidoCentavos: parsed.efectivoRecibidoCentavos,
    });

    // Business-level stock flag BEFORE product-level seguirStock
    if (this.#stockEnabled && producto.seguirStock) {
      await this.#movements.create({
        productoId: parsed.productoId,
        fecha: parsed.fecha ?? today(),
        tipo: 'salida',
        cantidad: parsed.cantidad ?? 1,
        costoUnitCentavos: producto.costoUnitCentavos,
        motivo: 'Venta',
        nota: undefined,
        businessId: parsed.businessId,
      });
    }

    return sale;
  }
}
