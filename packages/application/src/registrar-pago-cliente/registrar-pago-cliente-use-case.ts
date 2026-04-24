/**
 * RegistrarPagoClienteUseCase (P1B-M6-T04).
 *
 * 1. Validates the NewClientPayment via Zod.
 * 2. Loads the target Venta; rejects if:
 *    - venta doesn't exist,
 *    - venta is not Crédito,
 *    - venta is already in `pagado` state.
 * 3. Rejects overpayments (sum of existing pagos + new monto > venta.monto).
 * 4. Persists the PagoCliente.
 * 5. Recomputes estadoPago (parcial vs pagado) based on the new running
 *    total and updates the Venta via SalesRepository.updatePaymentState.
 */

import {
  NewClientPaymentSchema,
  type ClientPayment,
  type NewClientPayment,
  type PaymentState,
} from '@cachink/domain';
import type {
  ClientPaymentsRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarPagoClienteUseCase
  implements UseCase<NewClientPayment, ClientPayment>
{
  readonly #payments: ClientPaymentsRepository;
  readonly #sales: SalesRepository;

  constructor(payments: ClientPaymentsRepository, sales: SalesRepository) {
    this.#payments = payments;
    this.#sales = sales;
  }

  async execute(input: NewClientPayment): Promise<ClientPayment> {
    const parsed = NewClientPaymentSchema.parse(input);
    const venta = await this.#sales.findById(parsed.ventaId);
    if (!venta) {
      throw new TypeError(`Venta ${parsed.ventaId} no existe`);
    }
    if (venta.metodo !== 'Crédito') {
      throw new TypeError('Solo ventas en Crédito aceptan pagos');
    }
    if (venta.estadoPago === 'pagado') {
      throw new TypeError('Venta ya está pagada');
    }

    const previo = await this.#payments.sumByVenta(parsed.ventaId);
    const nuevoTotal = previo + parsed.montoCentavos;
    if (nuevoTotal > venta.monto) {
      throw new TypeError('El pago excede el monto restante de la venta');
    }

    const pago = await this.#payments.create(parsed);
    const nextState: PaymentState = nuevoTotal === venta.monto ? 'pagado' : 'parcial';
    await this.#sales.updatePaymentState(parsed.ventaId, nextState);
    return pago;
  }
}
