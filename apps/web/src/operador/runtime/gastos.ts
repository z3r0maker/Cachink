/**
 * The register's petty-cash expenses (O-35): the open turno's gastos from its
 * own database, and the write through `RegistrarEgresoUseCase` — scoped to
 * the turno so the expected-cash calculator sees them (ADR-074). Receipt
 * photos wait for the storage bucket (ADR-083 D3, still provisional).
 */

import { RegistrarEgresoUseCase } from '@xangarro/application';
import {
  DrizzleCajaTurnosRepository,
  DrizzleExpensesRepository,
  DrizzleRecurringExpensesRepository,
} from '@xangarro/data';
import type { BusinessId, CajaTurnoId, ExpenseCategory, UserId } from '@xangarro/domain';

import { categoriaDominio, categoriaOperador } from '../vocabulario';
import { hoyLocal } from './fechas';
import type { Db } from './db-types';
import type { GastoPara } from './protocol';

/** The turno's expenses as Gastos lists them, plus the turno's apertura. */
export async function gastosDelTurno(
  db: Db,
  businessId: BusinessId,
  deviceId: string,
  turnoId: string,
): Promise<{ readonly desde: string; readonly gastos: readonly GastoPara[] }> {
  void businessId;
  const turnos = new DrizzleCajaTurnosRepository(db as never, deviceId as never);
  const turno = await turnos.findById(turnoId as never);
  const expenses = new DrizzleExpensesRepository(db as never, deviceId as never);
  const rows = await expenses.findByCajaTurno(turnoId as never);
  return {
    desde: (turno?.aperturaAt ?? '').slice(11, 16),
    gastos: rows.map((g) => ({
      id: g.id,
      concepto: g.concepto,
      montoCentavos: g.monto.toString(),
      categoria: categoriaOperador(g.categoria as ExpenseCategory),
      hora: g.createdAt.slice(11, 16),
      proveedor: g.proveedor,
    })),
  };
}

/** Record a gasto of the open turno through the real use case. */
export async function registrarGasto(
  db: Db,
  p: {
    readonly businessId: BusinessId;
    readonly deviceId: string;
    readonly userId: UserId;
    readonly turnoId: CajaTurnoId;
    readonly concepto: string;
    readonly categoria: string;
    readonly monto: bigint;
    readonly proveedor: string | null;
  },
): Promise<{ readonly id: string }> {
  const useCase = new RegistrarEgresoUseCase(
    new DrizzleExpensesRepository(db as never, p.deviceId as never, p.userId as never),
    new DrizzleRecurringExpensesRepository(db as never, p.deviceId as never),
  );
  const gasto = await useCase.execute({
    fecha: hoyLocal() as never,
    concepto: p.concepto,
    categoria: categoriaDominio(p.categoria as never),
    monto: p.monto,
    cajaTurnoId: p.turnoId,
    ...(p.proveedor === null ? {} : { proveedor: p.proveedor }),
    businessId: p.businessId,
  });
  return { id: gasto.id };
}
