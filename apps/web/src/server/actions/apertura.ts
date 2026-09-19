'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import {
  BloquearSaldosInicialesUseCase,
  CapturarInventarioInicialUseCase,
  GuardarSaldosInicialesUseCase,
  type AperturaMovementsPort,
  type OpeningBalancesPort,
} from '@xangarro/application';
import {
  inventoryMovements,
  lockOpeningBalance,
  openingBalanceClientsOf,
  openingBalanceOf,
  saveOpeningBalance,
} from '@xangarro/data-pg';
import { newUlid, type BusinessId, type ProductId } from '@xangarro/domain';
import { APERTURA_MOTIVO, PORTAL_DEVICE_ID } from '@xangarro/domain/usage';

import { pesosToCentavos } from '@/lib/money';
import { requireMember } from '../auth';
import { withTenant, type Tx } from '../db';
import { reportError } from '../observability/report';

/**
 * N-17's portal side: the saldos iniciales screen and the one-time
 * inventario inicial capture — every write inside the tenant transaction, so
 * the phones learn of it (§5) and the usage rules see apertura movements the
 * day they land.
 */

type PortError = { code?: string };

function fallo(error: unknown, endpoint: string): { ok: false; message: string } {
  const code = (error as PortError | null)?.code;
  if (code === 'NOT_PERMITTED' || code?.startsWith('SALDOS_') || code?.startsWith('INVENTARIO_')) {
    return { ok: false, message: (error as Error).message };
  }
  reportError(error, { endpoint });
  return { ok: false, message: 'No pudimos guardar. Intenta de nuevo.' };
}

/** Money in, centavos out; a malformed amount is the user's to fix. */
function pesos(v: string): bigint {
  const c = pesosToCentavos(v.trim());
  if (c === null) throw new Error(`«${v}» no es un monto.`);
  return c;
}

function centavosAPesos(c: bigint): string {
  const whole = c / 100n;
  const cents = (c % 100n).toString().padStart(2, '0');
  return `${whole.toLocaleString('es-MX')}.${cents}`;
}

function saldosPort(tx: Tx): OpeningBalancesPort {
  return {
    of: (id) => openingBalanceOf(tx, id),
    save: async (input) => {
      // One header per business: reuse its id so the upsert is a true replace.
      const existing = await openingBalanceOf(tx, input.businessId);
      await saveOpeningBalance(tx, { id: existing?.id ?? newUlid(), ...input });
    },
    lock: (id) => lockOpeningBalance(tx, id),
  };
}

export interface SaldosInicialesForm {
  readonly fechaApertura: string;
  readonly caja: string;
  readonly bancos: string;
  readonly lines: readonly { readonly clienteId: string; readonly saldo: string }[];
}

export type SaldosResult = { ok: true } | { ok: false; message: string };

export async function guardarSaldosIniciales(form: SaldosInicialesForm): Promise<SaldosResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    await withTenant(businessId, (tx) =>
      new GuardarSaldosInicialesUseCase(saldosPort(tx)).execute({
        businessId,
        fechaApertura: form.fechaApertura,
        cajaCentavos: pesos(form.caja),
        bancosCentavos: pesos(form.bancos),
        lines: form.lines.map((l) => ({ clienteId: l.clienteId, saldoCentavos: pesos(l.saldo) })),
      }),
    );
    revalidatePath('/saldos-iniciales');
    revalidatePath('/estados');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'guardarSaldosIniciales');
  }
}

export async function bloquearSaldosIniciales(): Promise<SaldosResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const locked = await withTenant(businessId, (tx) =>
      new BloquearSaldosInicialesUseCase(saldosPort(tx)).execute({ businessId }),
    );
    if (!locked) return { ok: false, message: 'Los saldos ya estaban bloqueados.' };
    revalidatePath('/saldos-iniciales');
    return { ok: true };
  } catch (error) {
    return fallo(error, 'bloquearSaldosIniciales');
  }
}

function movimientosPort(tx: Tx, businessId: BusinessId): AperturaMovementsPort {
  const aperturaRows = async (): Promise<readonly { id: string }[]> =>
    tx
      .select({ id: inventoryMovements.id })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.businessId, businessId),
          eq(inventoryMovements.motivo, APERTURA_MOTIVO),
        ),
      )
      .limit(1);

  return {
    existsApertura: async () => (await aperturaRows()).length > 0,
    create: async (input) => {
      const stamp = new Date().toISOString();
      await tx.insert(inventoryMovements).values({
        id: newUlid(),
        businessId,
        productoId: input.productoId as ProductId,
        fecha: input.fecha,
        tipo: 'entrada',
        cantidad: input.cantidad,
        costoUnitCentavos: input.costoUnitCentavos,
        motivo: APERTURA_MOTIVO,
        nota: null,
        deviceId: PORTAL_DEVICE_ID,
        createdByUserId: null,
        createdAt: stamp,
        updatedAt: stamp,
        deletedAt: null,
      });
    },
  };
}

export interface InventarioInicialRow {
  readonly productoId: string;
  readonly cantidad: number;
  readonly costo: string;
}

export type CapturaResult =
  | { ok: true; total: string; movimientos: number }
  | { ok: false; message: string };

export async function capturarInventarioInicial(
  fecha: string,
  rows: readonly InventarioInicialRow[],
): Promise<CapturaResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const result = await withTenant(businessId, (tx) =>
      new CapturarInventarioInicialUseCase(movimientosPort(tx, businessId)).execute({
        businessId,
        fecha,
        rows: rows.map((r) => ({
          productoId: r.productoId,
          cantidad: r.cantidad,
          costoUnitCentavos: pesos(r.costo),
        })),
      }),
    );
    revalidatePath('/inventario-inicial');
    revalidatePath('/productos');
    revalidatePath('/estados');
    return { ok: true, total: centavosAPesos(result.total), movimientos: result.movimientos };
  } catch (error) {
    return fallo(error, 'capturarInventarioInicial');
  }
}

/** Read-side for the screens (no 'use server' mutation semantics needed). */
export async function saldosActuales(businessId: string) {
  return withTenant(businessId, async (tx) => ({
    header: await openingBalanceOf(tx, businessId),
    lines: await openingBalanceClientsOf(tx, businessId),
  }));
}

export async function inventarioInicialYaCapturado(businessId: string): Promise<boolean> {
  return withTenant(businessId, async (tx) => {
    const rows = await tx
      .select({ id: inventoryMovements.id })
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.businessId, businessId),
          eq(inventoryMovements.motivo, APERTURA_MOTIVO),
        ),
      )
      .limit(1);
    return rows.length > 0;
  });
}
