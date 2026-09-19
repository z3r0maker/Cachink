/**
 * RegistrarPagoClienteUseCase — record a client's abono (ADR-074).
 *
 * An abono belongs to the client, not to a sale: how it settles their
 * tickets (oldest first) and their balance are derived by `estadoDeCuenta`
 * — nothing here stores or mutates a balance or a sale's estadoPago. The
 * whole amount is recorded even above the balance (ADR-083 D5): the cash is
 * in the drawer, and the excess is the client's saldo a favor.
 */

import {
  AbonoInvalidoError,
  NewClientPaymentSchema,
  type ClientPayment,
  type NewClientPayment,
} from '@xangarro/domain';
import type { ClientPaymentsRepository, ClientsRepository } from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

export class RegistrarPagoClienteUseCase implements UseCase<NewClientPayment, ClientPayment> {
  readonly #payments: ClientPaymentsRepository;
  readonly #clients: ClientsRepository;

  constructor(payments: ClientPaymentsRepository, clients: ClientsRepository) {
    this.#payments = payments;
    this.#clients = clients;
  }

  async execute(input: NewClientPayment): Promise<ClientPayment> {
    const parsed = NewClientPaymentSchema.parse(input);
    if (parsed.montoCentavos <= 0n) {
      throw new AbonoInvalidoError();
    }
    const cliente = await this.#clients.findById(parsed.clienteId);
    if (!cliente) {
      throw new TypeError(`Cliente ${parsed.clienteId} no existe`);
    }
    if (cliente.estadoRevision === 'fusionado' || cliente.estadoRevision === 'rechazado') {
      throw new TypeError(
        cliente.estadoRevision === 'fusionado'
          ? 'Cliente fusionado en revisión: cobra a la ficha vigente'
          : 'Cliente rechazado en revisión: no acepta abonos',
      );
    }

    return this.#payments.create(parsed);
  }
}
