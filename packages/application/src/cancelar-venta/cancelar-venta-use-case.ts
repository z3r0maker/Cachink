/**
 * CancelarVentaUseCase — cancel a sale with permission check, PIN
 * verification, stock reversal, and audit logging.
 *
 * Steps:
 *   1. Verify user exists + PIN matches
 *   2. Verify user has canCancelSales permission
 *   3. Load the sale (must exist, must not already be cancelled)
 *   4. Soft-cancel the sale (set cancellation fields)
 *   5. If stock ON + producto.seguirStock → create entrada movement
 *   6. Create immutable CancelacionLog audit record
 *   7. Return the cancel result (includes cashToReturn for cash sales)
 */

import { compare } from 'bcryptjs';
import {
  today,
  parseUserPermissions,
  canUserCancelSales,
  type Sale,
} from '@cachink/domain';
import type {
  BusinessId,
  SaleId,
  UserId,
} from '@cachink/domain';
import type {
  CancelacionLogsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
  UsersRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface CancelarVentaInput {
  readonly saleId: SaleId;
  readonly userId: UserId;
  readonly pin: string;
  readonly motivo: string;
  readonly businessId: BusinessId;
  /** Business-level stock feature flag. */
  readonly stockEnabled?: boolean;
}

export interface CancelarVentaResult {
  readonly sale: Sale;
  /** Non-null if cash was the payment method — UI shows "Devuelve $X". */
  readonly cashToReturn: bigint | null;
  readonly stockReversed: boolean;
  readonly cantidadDevuelta: number | null;
}

export class CancelarVentaUseCase
  implements UseCase<CancelarVentaInput, CancelarVentaResult>
{
  readonly #sales: SalesRepository;
  readonly #users: UsersRepository;
  readonly #products: ProductsRepository;
  readonly #movements: InventoryMovementsRepository;
  readonly #logs: CancelacionLogsRepository;

  constructor(
    sales: SalesRepository,
    users: UsersRepository,
    products: ProductsRepository,
    movements: InventoryMovementsRepository,
    logs: CancelacionLogsRepository,
  ) {
    this.#sales = sales;
    this.#users = users;
    this.#products = products;
    this.#movements = movements;
    this.#logs = logs;
  }

  async execute(input: CancelarVentaInput): Promise<CancelarVentaResult> {
    await this.#verifyUserAndPin(input.userId, input.pin);
    const sale = await this.#loadAndValidateSale(input.saleId);
    await this.#sales.delete(input.saleId);

    const { stockReversed, cantidadDevuelta } =
      await this.#reverseStock(sale, input);
    const cashToReturn =
      sale.metodo === 'Efectivo' ? sale.monto : null;

    await this.#createAuditLog(input, sale, cashToReturn, stockReversed, cantidadDevuelta);
    return { sale, cashToReturn, stockReversed, cantidadDevuelta };
  }

  async #verifyUserAndPin(userId: UserId, pin: string): Promise<void> {
    const user = await this.#users.findById(userId);
    if (!user) throw new TypeError('Usuario no encontrado');
    const pinOk = await compare(pin, user.pinHash);
    if (!pinOk) throw new TypeError('PIN incorrecto');

    const raw = (user as Record<string, unknown>).permissions;
    const perms = parseUserPermissions(
      typeof raw === 'string' ? raw : '{}',
    );
    if (!canUserCancelSales(user.role, perms)) {
      throw new TypeError('No tienes permiso para cancelar ventas');
    }
  }

  async #loadAndValidateSale(saleId: SaleId): Promise<Sale> {
    const sale = await this.#sales.findById(saleId);
    if (!sale) throw new TypeError('Venta no encontrada');
    if (sale.cancelledAt) {
      throw new TypeError('Esta venta ya fue cancelada');
    }
    return sale;
  }

  async #reverseStock(
    sale: Sale,
    input: CancelarVentaInput,
  ): Promise<{ stockReversed: boolean; cantidadDevuelta: number | null }> {
    const stockEnabled = input.stockEnabled ?? true;
    if (!stockEnabled) return { stockReversed: false, cantidadDevuelta: null };

    const producto = await this.#products.findById(sale.productoId);
    if (!producto?.seguirStock) return { stockReversed: false, cantidadDevuelta: null };

    await this.#movements.create({
      productoId: sale.productoId,
      fecha: today(),
      tipo: 'entrada',
      cantidad: sale.cantidad,
      costoUnitCentavos: producto.costoUnitCentavos,
      motivo: 'Devolución de cliente',
      nota: `Cancelación de venta: ${input.motivo}`,
      businessId: input.businessId,
    });
    return { stockReversed: true, cantidadDevuelta: sale.cantidad };
  }

  async #createAuditLog(
    input: CancelarVentaInput,
    sale: Sale,
    cashToReturn: bigint | null,
    stockReversed: boolean,
    cantidadDevuelta: number | null,
  ): Promise<void> {
    await this.#logs.create({
      saleId: input.saleId,
      cancelledByUserId: input.userId,
      motivo: input.motivo,
      montoOriginalCentavos: sale.monto,
      metodoOriginal: sale.metodo,
      cashReturnedCentavos: cashToReturn,
      stockReversed,
      cantidadDevuelta,
      productoId: stockReversed ? sale.productoId : null,
      businessId: input.businessId,
    });
  }
}
