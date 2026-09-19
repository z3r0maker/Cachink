/**
 * CerrarCorteDeDiaUseCase (P1B-M6-T05).
 *
 * Gathers today's ventas + egresos + previous corte, runs the domain
 * calcCorteDeDia, and persists a DayClose. The one-per-(fecha, deviceId)
 * rule is enforced here — if a corte for today already exists we throw,
 * the caller must delete the prior corte first (rare; only happens if
 * the Operativo mis-counted and re-opens it).
 */

import {
  calculateCorteDeDia,
  conTotales,
  vigentes,
  type BusinessId,
  type DayClose,
  type DayCloseRole,
  type IsoDate,
  type Money,
} from '@xangarro/domain';
import type {
  DayClosesRepository,
  ExpensesRepository,
  SalesRepository,
  TicketsRepository,
} from '@xangarro/data';
import type { UseCase } from '../_use-case.js';

export interface CerrarCorteDeDiaInput {
  fecha: IsoDate;
  businessId: BusinessId;
  deviceId: string; // DeviceId from composition root
  efectivoContadoCentavos: Money;
  explicacion?: string;
  cerradoPor: DayCloseRole;
}

export class CerrarCorteDeDiaUseCase implements UseCase<CerrarCorteDeDiaInput, DayClose> {
  readonly #tickets: TicketsRepository;
  readonly #sales: SalesRepository;
  readonly #expenses: ExpensesRepository;
  readonly #closes: DayClosesRepository;

  constructor(
    tickets: TicketsRepository,
    sales: SalesRepository,
    expenses: ExpensesRepository,
    closes: DayClosesRepository,
  ) {
    this.#tickets = tickets;
    this.#sales = sales;
    this.#expenses = expenses;
    this.#closes = closes;
  }

  async execute(input: CerrarCorteDeDiaInput): Promise<DayClose> {
    const existing = await this.#closes.findByDate(input.fecha, input.deviceId as never);
    if (existing) {
      throw new TypeError(`Ya existe un corte para ${input.fecha} en este dispositivo`);
    }

    const [ticketsHoy, lineasHoy, egresosHoy, corteAnterior] = await Promise.all([
      this.#tickets.findByDate(input.fecha, input.businessId),
      this.#sales.findByDate(input.fecha, input.businessId),
      this.#expenses.findByDate(input.fecha, input.businessId),
      this.#closes.findLatest(input.businessId),
    ]);
    const ventasHoy = conTotales(vigentes(ticketsHoy), lineasHoy);

    const { esperado } = calculateCorteDeDia({
      ventasHoy,
      egresosHoy,
      saldoCierreAnterior: corteAnterior?.efectivoContadoCentavos ?? 0n,
      efectivoContado: input.efectivoContadoCentavos,
    });

    return this.#closes.create({
      fecha: input.fecha,
      efectivoEsperadoCentavos: esperado,
      efectivoContadoCentavos: input.efectivoContadoCentavos,
      explicacion: input.explicacion,
      cerradoPor: input.cerradoPor,
      businessId: input.businessId,
    });
  }
}
