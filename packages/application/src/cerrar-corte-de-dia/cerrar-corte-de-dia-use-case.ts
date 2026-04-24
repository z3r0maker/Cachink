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
  type BusinessId,
  type DayClose,
  type DayCloseRole,
  type IsoDate,
  type Money,
} from '@cachink/domain';
import type {
  DayClosesRepository,
  ExpensesRepository,
  SalesRepository,
} from '@cachink/data';
import type { UseCase } from '../_use-case.js';

export interface CerrarCorteDeDiaInput {
  fecha: IsoDate;
  businessId: BusinessId;
  deviceId: string; // DeviceId from composition root
  efectivoContadoCentavos: Money;
  explicacion?: string;
  cerradoPor: DayCloseRole;
}

export class CerrarCorteDeDiaUseCase
  implements UseCase<CerrarCorteDeDiaInput, DayClose>
{
  readonly #sales: SalesRepository;
  readonly #expenses: ExpensesRepository;
  readonly #closes: DayClosesRepository;

  constructor(
    sales: SalesRepository,
    expenses: ExpensesRepository,
    closes: DayClosesRepository,
  ) {
    this.#sales = sales;
    this.#expenses = expenses;
    this.#closes = closes;
  }

  async execute(input: CerrarCorteDeDiaInput): Promise<DayClose> {
    const existing = await this.#closes.findByDate(input.fecha, input.deviceId as never);
    if (existing) {
      throw new TypeError(`Ya existe un corte para ${input.fecha} en este dispositivo`);
    }

    const [ventasHoy, egresosHoy, corteAnterior] = await Promise.all([
      this.#sales.findByDate(input.fecha, input.businessId),
      this.#expenses.findByDate(input.fecha, input.businessId),
      this.#closes.findLatest(input.businessId),
    ]);

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
