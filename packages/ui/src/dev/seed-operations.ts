/**
 * Operational seeders — inventory, day closes, caja turnos.
 *
 * Extracted from seed-demo-data.ts so each file stays under the
 * 200-line budget (CLAUDE.md §2.6).
 */

import type { BusinessId, Product, UserId } from '@cachink/domain';
import type { Repositories } from '../app/repository-provider';
import { INITIAL_STOCK } from './demo-data-catalog';
import { toIsoDate, toTs, daysAgo } from './seed-helpers';

// ── Inventory ──────────────────────────────────────────────────────────

export async function seedInventory(
  r: Repositories,
  biz: BusinessId,
  products: Product[],
): Promise<number> {
  let count = 0;
  for (let i = 0; i < products.length; i++) {
    const product = products[i]!;
    const qty = INITIAL_STOCK[i] ?? 10;
    if (qty <= 0) continue;
    await r.inventoryMovements.create({
      productoId: product.id,
      fecha: toIsoDate(daysAgo(25)),
      tipo: 'entrada',
      cantidad: qty,
      costoUnitCentavos: product.costoUnitCentavos,
      motivo: 'Compra a proveedor',
      businessId: biz,
    });
    count += 1;
  }
  return count;
}

// ── Day closes ─────────────────────────────────────────────────────────

export async function seedDayCloses(
  r: Repositories,
  biz: BusinessId,
): Promise<number> {
  let count = 0;
  const offsets = [1, 2, 3, 4, 5];
  for (const offset of offsets) {
    const d = daysAgo(offset);
    const esperado = 250_000n + BigInt(offset * 15_000);
    const contado = esperado - BigInt(offset * 500);
    await r.dayCloses.create({
      fecha: toIsoDate(d),
      efectivoEsperadoCentavos: esperado,
      efectivoContadoCentavos: contado,
      cerradoPor: 'Operativo',
      businessId: biz,
    });
    count += 1;
  }
  return count;
}

// ── Caja turnos ────────────────────────────────────────────────────────

export async function seedCajaTurnos(
  r: Repositories,
  biz: BusinessId,
  directorId: UserId,
  operativoId: UserId,
): Promise<number> {
  let count = 0;

  // Past 5 days: one closed turn each
  for (let day = 5; day >= 1; day--) {
    count += await seedClosedTurn(r, biz, operativoId, day);
  }

  // Today morning shift (closed — enables cambio de turno)
  count += await seedTodayMorning(r, biz, operativoId);

  // Today afternoon shift (OPEN — user can close it)
  count += await seedTodayAfternoon(r, biz, directorId);

  return count;
}

async function seedClosedTurn(
  r: Repositories,
  biz: BusinessId,
  userId: UserId,
  day: number,
): Promise<number> {
  const d = daysAgo(day);
  const apertura = new Date(d);
  apertura.setUTCHours(8, 0, 0, 0);
  const cierre = new Date(d);
  cierre.setUTCHours(18, 0, 0, 0);

  const turno = await r.cajaTurnos.create({
    userId,
    fecha: toIsoDate(d),
    aperturaAt: toTs(apertura),
    montoAperturaCentavos: 50_000n,
    efectivoAdicionalCentavos: 0n,
    businessId: biz,
  });

  await r.cajaTurnos.update(turno.id, {
    cierreAt: toTs(cierre),
    montoCierreCentavos: 320_000n + BigInt(day * 5_000),
    efectivoEsperadoCentavos: 325_000n + BigInt(day * 5_000),
    diferenciaCentavos: -5_000n,
    discrepancyReason: 'error-en-cambio',
    explicacion: 'Faltaron monedas en el cambio',
    totalTransferencias: 45_000n,
    totalTarjeta: 30_000n,
    totalQr: 0n,
    totalCredito: 15_000n,
  });

  return 1;
}

async function seedTodayMorning(
  r: Repositories,
  biz: BusinessId,
  userId: UserId,
): Promise<number> {
  const todayDate = new Date();
  const morningOpen = new Date(todayDate);
  morningOpen.setUTCHours(8, 0, 0, 0);
  const morningClose = new Date(todayDate);
  morningClose.setUTCHours(14, 0, 0, 0);

  const turno = await r.cajaTurnos.create({
    userId,
    fecha: toIsoDate(todayDate),
    aperturaAt: toTs(morningOpen),
    montoAperturaCentavos: 50_000n,
    efectivoAdicionalCentavos: 0n,
    businessId: biz,
  });

  await r.cajaTurnos.update(turno.id, {
    cierreAt: toTs(morningClose),
    montoCierreCentavos: 280_000n,
    efectivoEsperadoCentavos: 285_000n,
    diferenciaCentavos: -5_000n,
    discrepancyReason: 'error-en-cambio',
    explicacion: null,
    totalTransferencias: 35_000n,
    totalTarjeta: 20_000n,
    totalQr: 0n,
    totalCredito: 0n,
  });

  return 1;
}

async function seedTodayAfternoon(
  r: Repositories,
  biz: BusinessId,
  userId: UserId,
): Promise<number> {
  const todayDate = new Date();
  const afternoonOpen = new Date(todayDate);
  afternoonOpen.setUTCHours(14, 30, 0, 0);

  await r.cajaTurnos.create({
    userId,
    fecha: toIsoDate(todayDate),
    aperturaAt: toTs(afternoonOpen),
    montoAperturaCentavos: 50_000n,
    efectivoAdicionalCentavos: 10_000n,
    businessId: biz,
  });

  return 1;
}
