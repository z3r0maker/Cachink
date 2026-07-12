/**
 * Fullstack scenario 6 — Gastos recurrentes lifecycle.
 *
 * Business narrative:
 *   1. Create a monthly recurring expense template
 *   2. Process it → Egreso created, proximoDisparo advanced
 *   3. Re-process same day → idempotent (no new Egreso)
 *   4. Descartar → advances date without creating Egreso
 *   5. Monthly clamping (31 → end of month)
 *   6. Inactive template → skipped
 *   7. Quincenal frequency → +15 days
 *
 * Covers: EGR-06 through EGR-13
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, IsoDate, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
  makeNewRecurringExpense,
} from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Gastos Recurrentes [fullstack]', () => {
  let h: FullstackHarness;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID });
    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));
  });

  it('processes a monthly template: creates Egreso and advances proximoDisparo', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        concepto: 'Renta',
        categoria: 'Renta',
        montoCentavos: 1_200_000n,
        frecuencia: 'mensual',
        diaDelMes: 1,
        proximoDisparo: '2026-05-01' as IsoDate,
      }),
    );

    const result = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-05-01' as IsoDate,
    });

    expect(result.processed).toBe(true);
    expect(result.egreso).not.toBeNull();
    expect(result.egreso!.monto).toBe(1_200_000n);
    expect(result.egreso!.concepto).toBe('Renta');
    expect(result.egreso!.categoria).toBe('Renta');
    expect(result.nextProximoDisparo).toBe('2026-06-01');
  });

  it('re-processing same day is idempotent', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-01' as IsoDate,
      }),
    );

    // First processing
    const first = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-05-01' as IsoDate,
    });
    expect(first.processed).toBe(true);

    // Re-process — should return the existing egreso, not a new one
    const second = await h.useCases.procesarGastoRecurrente.execute({
      template, // same template (old proximoDisparo — simulates double-tap)
      today: '2026-05-01' as IsoDate,
    });
    expect(second.processed).toBe(true);
    // The egreso returned should be the same one
    expect(second.egreso!.id).toBe(first.egreso!.id);

    // Only 1 egreso for the date
    const egresos = await h.repos.expenses.findByDate('2026-05-01', BIZ);
    const linked = egresos.filter((e) => e.gastoRecurrenteId === template.id);
    expect(linked.length).toBe(1);
  });

  it('descartar advances date without creating Egreso', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-01' as IsoDate,
        frecuencia: 'mensual',
        diaDelMes: 1,
      }),
    );

    const result = await h.useCases.descartarGastoRecurrente.execute({
      template,
      today: '2026-05-01' as IsoDate,
    });

    expect(result.skipped).toBe(false);
    expect(result.nextProximoDisparo).toBe('2026-06-01');

    // No Egreso created
    const egresos = await h.repos.expenses.findByDate('2026-05-01', BIZ);
    expect(egresos.length).toBe(0);
  });

  it('monthly clamp: day 31 → last day of month with 30 days', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-01-31' as IsoDate,
        frecuencia: 'mensual',
        diaDelMes: 31,
      }),
    );

    const result = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-01-31' as IsoDate,
    });

    // February 2026 has 28 days → clamped to 28
    expect(result.nextProximoDisparo).toBe('2026-02-28');
  });

  it('inactive template is skipped', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-01' as IsoDate,
        activo: false,
      }),
    );

    const result = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-05-01' as IsoDate,
    });

    expect(result.processed).toBe(false);
    expect(result.egreso).toBeNull();
  });

  it('semanal frequency advances by 7 days', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-05' as IsoDate,
        frecuencia: 'semanal',
        diaDelMes: null,
      }),
    );

    const result = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-05-05' as IsoDate,
    });

    expect(result.nextProximoDisparo).toBe('2026-05-12');
  });

  it('quincenal frequency advances by 15 days', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-01' as IsoDate,
        frecuencia: 'quincenal',
        diaDelMes: null,
      }),
    );

    const result = await h.useCases.procesarGastoRecurrente.execute({
      template,
      today: '2026-05-01' as IsoDate,
    });

    expect(result.nextProximoDisparo).toBe('2026-05-16');
  });

  it('egreso linked to inactive recurring template is rejected', async () => {
    const template = await h.repos.recurring.create(
      makeNewRecurringExpense({
        businessId: BIZ,
        proximoDisparo: '2026-05-01' as IsoDate,
        activo: false,
      }),
    );

    await expect(
      h.useCases.registrarEgreso.execute({
        fecha: '2026-05-01',
        concepto: 'Manual link',
        categoria: 'Otro',
        monto: 500n,
        gastoRecurrenteId: template.id,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/inactivo/i);
  });
});
