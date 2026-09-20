/**
 * CapturarInventarioInicialUseCase (N-17): the one-time opening-stock step.
 * Writes one `entrada` movement per product with motivo
 * `Apertura de inventario` — the origen the usage rules never count and the
 * inventory valuation reads — and, unlike a normal entrada, **no egreso**:
 * day-one stock is not a purchase, no money left the business.
 * One-time: a second run is refused, not merged.
 */

import {
  InventarioInicialInvalidoError,
  InventarioInicialYaCapturadoError,
  type ValuacionInventarioInicial,
} from '@xangarro/domain';
import { APERTURA_MOTIVO } from '@xangarro/domain/usage';
import type { UseCase } from '../_use-case.js';

export interface AperturaMovementsPort {
  /** True when any apertura movement exists for the business (one-time gate). */
  existsApertura(businessId: string): Promise<boolean>;
  create(input: {
    readonly productoId: string;
    readonly cantidad: number;
    readonly costoUnitCentavos: bigint;
    readonly fecha: string;
  }): Promise<void>;
}

export interface CapturarInventarioInicialInput {
  readonly businessId: string;
  /** The capture date; the grid's rows. */
  readonly fecha: string;
  readonly rows: readonly {
    readonly productoId: string;
    readonly cantidad: number;
    readonly costoUnitCentavos: bigint;
  }[];
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export class CapturarInventarioInicialUseCase implements UseCase<
  CapturarInventarioInicialInput,
  ValuacionInventarioInicial
> {
  constructor(private readonly port: AperturaMovementsPort) {}

  async execute(input: CapturarInventarioInicialInput): Promise<ValuacionInventarioInicial> {
    if (await this.port.existsApertura(input.businessId)) {
      throw new InventarioInicialYaCapturadoError();
    }
    const campos: string[] = [];
    if (!FECHA.test(input.fecha)) campos.push('fecha');
    input.rows.forEach((row, i) => {
      if (!Number.isInteger(row.cantidad) || row.cantidad <= 0) campos.push(`fila ${i + 1}`);
      if (row.costoUnitCentavos < 0n) campos.push(`costo fila ${i + 1}`);
    });
    if (campos.length > 0) throw new InventarioInicialInvalidoError(campos);

    let total = 0n;
    for (const row of input.rows) {
      await this.port.create({
        productoId: row.productoId,
        cantidad: row.cantidad,
        costoUnitCentavos: row.costoUnitCentavos,
        fecha: input.fecha,
      });
      total += row.costoUnitCentavos * BigInt(row.cantidad);
    }
    return { total, movimientos: input.rows.length };
  }
}

/** The motivo the movements carry; exported for the pg repo's WHERE. */
export const MOTIVO_APERTURA = APERTURA_MOTIVO;
