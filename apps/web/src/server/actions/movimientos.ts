'use server';

import { RegistrarMovimientoInventarioUseCase } from '@xangarro/application';
import type { BusinessId, NewInventoryMovement, ProductId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { pgExpensesCreator, pgMovementsCreator } from '../repositories/ledger';

/**
 * Record a stock movement from the portal (ADR-081): an entrada, a merma, an
 * ajuste. The rules — valid reasons per tipo, the purchase expense an entrada
 * books — are `RegistrarMovimientoInventarioUseCase`'s, the phone's own. The
 * movement is logged, so every phone's stock includes it after its next pull.
 */
export interface MovimientoForm {
  readonly productoId: string;
  readonly tipo: 'entrada' | 'salida';
  readonly cantidad: number;
  /** Centavos. Server actions carry `bigint`, so money never becomes a float. */
  readonly costoUnitCentavos: bigint;
  readonly motivo: string;
  readonly nota?: string;
}

export type MovimientoResult = { ok: true } | { ok: false; message: string };

const today = (): string => new Date().toISOString().slice(0, 10);

export async function registrarMovimiento(form: MovimientoForm): Promise<MovimientoResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const input: NewInventoryMovement = {
      productoId: form.productoId as ProductId,
      fecha: today() as NewInventoryMovement['fecha'],
      tipo: form.tipo,
      cantidad: form.cantidad,
      costoUnitCentavos: form.costoUnitCentavos as NewInventoryMovement['costoUnitCentavos'],
      motivo: form.motivo,
      ...(form.nota ? { nota: form.nota } : {}),
      origen: 'portal',
      businessId,
    };
    await withTenant(businessId, (tx) =>
      new RegistrarMovimientoInventarioUseCase(
        pgMovementsCreator(tx, businessId),
        pgExpensesCreator(tx, businessId),
      ).execute(input),
    );
    revalidatePath('/productos');
    return { ok: true };
  } catch (error) {
    return failure(error, 'registrarMovimiento', {
      invalid: () => 'Revisa la cantidad, el costo y el motivo.',
      retry: 'No pudimos registrar el movimiento. Intenta de nuevo.',
    });
  }
}
