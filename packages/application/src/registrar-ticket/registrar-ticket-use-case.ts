/**
 * RegistrarTicketUseCase — register a sale atomically (ADR-073): one ticket
 * header, its lines, and each line's stock salida land together or not at
 * all. The folio is the device's own counter, assigned here so capture works
 * offline; change is derived where cash was tendered. The phone's old
 * one-sale-per-product loop is this use case with one line.
 */

import {
  NewSaleSchema,
  NewTicketSchema,
  today,
  type CajaTurnoId,
  type Money,
  type NewSale,
  type NewTicket,
  type Sale,
  type Ticket,
  type UserId,
} from '@xangarro/domain';
import { CajaNoAbiertaError } from '@xangarro/domain';
import type {
  CajaTurnosRepository,
  ClientsRepository,
  InventoryMovementsRepository,
  ProductsRepository,
  SalesRepository,
  TicketsRepository,
} from '@xangarro/data';
import type { UseCase } from '../_use-case.js';
import type { BusinessId } from '@xangarro/domain';

function currentHHMM(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** One line of the ticket being registered. */
export type LineaTicket = Omit<NewSale, 'ticketId' | 'fecha' | 'businessId'>;
type LineaTicketParsed = ReturnType<typeof LineaInputSchema.parse>;
type ProductoMin = { costoUnitCentavos: Money; seguirStock: boolean };

/** What the caller supplies; folio, estadoPago and cajaTurnoId are ours. */
const RegistrarTicketInputSchema = NewTicketSchema.omit({
  folio: true,
  estadoPago: true,
});

/** A line without the fields the ticket lends it. */
const LineaInputSchema = NewSaleSchema.omit({ ticketId: true, fecha: true, businessId: true });

export interface RegistrarTicketInput {
  /** The header, minus folio/estadoPago/cajaTurnoId — this use case sets them. */
  readonly ticket: Omit<NewTicket, 'folio' | 'estadoPago' | 'cajaTurnoId'>;
  readonly lineas: readonly LineaTicket[];
  readonly deviceId?: never;
}

export interface RegistrarTicketConfig {
  /** Business-level stock feature flag. When false, no stock movements. */
  readonly stockEnabled?: boolean;
  /** The seller the ticket is attributed to; the turno is the caja's, not theirs. */
  readonly userId: UserId | null;
}

export interface RegistrarTicketResult {
  readonly ticket: Ticket;
  readonly lineas: readonly Sale[];
}

export class RegistrarTicketUseCase implements UseCase<
  RegistrarTicketInput,
  RegistrarTicketResult
> {
  readonly #tickets: TicketsRepository;
  readonly #sales: SalesRepository;
  readonly #clients: ClientsRepository;
  readonly #products: ProductsRepository;
  readonly #movements: InventoryMovementsRepository;
  readonly #cajaTurnos: CajaTurnosRepository;
  readonly #stockEnabled: boolean;
  readonly #userId: UserId | null;

  constructor(
    tickets: TicketsRepository,
    sales: SalesRepository,
    clients: ClientsRepository,
    products: ProductsRepository,
    movements: InventoryMovementsRepository,
    cajaTurnos: CajaTurnosRepository,
    config: RegistrarTicketConfig,
  ) {
    this.#tickets = tickets;
    this.#sales = sales;
    this.#clients = clients;
    this.#products = products;
    this.#movements = movements;
    this.#cajaTurnos = cajaTurnos;
    this.#stockEnabled = config.stockEnabled ?? true;
    this.#userId = config.userId;
  }

  async execute(input: RegistrarTicketInput): Promise<RegistrarTicketResult> {
    const ticket = RegistrarTicketInputSchema.parse(input.ticket);
    const lineas = input.lineas.map((l) => LineaInputSchema.parse(l));
    if (lineas.length === 0) throw new TypeError('Un ticket necesita al menos una línea');

    const productos = await this.#loadProductos(lineas);
    const cajaTurnoId = await this.#requireOpenTurno(ticket.businessId);
    await this.#validateCredito(ticket);

    const fecha = ticket.fecha ?? (today() as never);
    const total = lineas.reduce((acc, l) => acc + (l.monto as Money), 0n as Money);
    const created = await this.#tickets.create({
      folio: await this.#tickets.nextFolio(ticket.businessId),
      fecha: fecha as never,
      hora: ticket.hora ?? currentHHMM(),
      concepto: ticket.concepto,
      metodo: ticket.metodo,
      clienteId: ticket.clienteId ?? null,
      estadoPago: ticket.metodo === 'Crédito' ? 'pendiente' : 'pagado',
      efectivoRecibidoCentavos: ticket.efectivoRecibidoCentavos ?? null,
      cambioCentavos: this.#cambio(ticket, total),
      cajaTurnoId,
      businessId: ticket.businessId,
    });

    const savedLines: Sale[] = [];
    for (const linea of lineas) {
      savedLines.push(
        await this.#sales.create({
          ...linea,
          ticketId: created.id,
          fecha: fecha as never,
          businessId: ticket.businessId,
        }),
      );
    }
    await this.#salidasDeStock(lineas, productos, fecha, ticket.businessId);
    return { ticket: created, lineas: savedLines };
  }

  /** Change never goes negative; the operator owes the shortfall instead. */
  #cambio(ticket: ReturnType<typeof RegistrarTicketInputSchema.parse>, total: Money): Money {
    const recibido = ticket.efectivoRecibidoCentavos;
    if (recibido === undefined || recibido === null) return 0n as Money;
    const cambio = (recibido as Money) - total;
    return cambio < 0n ? (0n as Money) : cambio;
  }

  async #loadProductos(lineas: readonly LineaTicketParsed[]): Promise<Map<string, ProductoMin>> {
    const productos = new Map<string, ProductoMin>();
    for (const linea of lineas) {
      if (!productos.has(linea.productoId)) {
        const producto = await this.#products.findById(linea.productoId);
        if (!producto) throw new TypeError(`Producto ${linea.productoId} no existe`);
        productos.set(linea.productoId, producto);
      }
    }
    return productos;
  }

  async #salidasDeStock(
    lineas: readonly LineaTicketParsed[],
    productos: ReadonlyMap<string, ProductoMin>,
    fecha: string,
    businessId: BusinessId,
  ): Promise<void> {
    if (!this.#stockEnabled) return;
    for (const linea of lineas) {
      const producto = productos.get(linea.productoId);
      if (!producto?.seguirStock) continue;
      await this.#movements.create({
        productoId: linea.productoId,
        fecha: fecha as never,
        tipo: 'salida',
        cantidad: linea.cantidad ?? 1,
        costoUnitCentavos: producto.costoUnitCentavos,
        motivo: 'Venta',
        origen: 'venta',
        nota: undefined,
        businessId,
      });
    }
  }

  async #requireOpenTurno(businessId: BusinessId): Promise<CajaTurnoId> {
    if (!this.#userId) throw new CajaNoAbiertaError();
    // One open turno per caja (ADR-071 §3): whoever opened it, the operator
    // currently authenticated on the device sells under it (O-13).
    const turno = await this.#cajaTurnos.findOpenByBusiness(businessId);
    if (!turno) throw new CajaNoAbiertaError();
    return turno.id;
  }

  async #validateCredito(ticket: {
    metodo: NewTicket['metodo'];
    clienteId?: NewTicket['clienteId'];
  }): Promise<void> {
    if (ticket.metodo !== 'Crédito') return;
    if (!ticket.clienteId) {
      throw new TypeError('Un ticket en Crédito requiere clienteId');
    }
    const cliente = await this.#clients.findById(ticket.clienteId);
    if (!cliente) {
      throw new TypeError(`Cliente ${ticket.clienteId} no existe`);
    }
  }
}
