/**
 * Fullstack scenario 2 — Complete Caja day.
 *
 * Business narrative:
 *   1. Open caja with initial amount
 *   2. Register cash sales + a retiro + a depósito
 *   3. Close caja with discrepancy → reason 'gasto-no-registrado' creates Egreso
 *   4. Run corte de día
 *   5. Second corte same day → rejected (duplicate)
 *   6. Verify retiro/depósito on closed turno → rejected
 *
 * Covers: CAJ-01 through CAJ-10
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, CajaTurnoId, UserId } from '@cachink/domain';
import { newEntityId } from '@cachink/domain';
import {
  makeNewBusiness,
  makeNewProduct,
  makeNewSale,
} from '../../../testing/src/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { buildHarness, type FullstackHarness } from './fullstack-harness.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const USER_ID = newEntityId<UserId>();

describe('Caja — Full Day [fullstack]', () => {
  let h: FullstackHarness;
  let turnoId: CajaTurnoId;

  beforeEach(async () => {
    h = buildHarness({ userId: USER_ID, stockEnabled: false });

    await h.repos.businesses.create(makeNewBusiness({ businessId: BIZ }));

    // Seed a non-stock product for sales
    const product = await h.repos.products.create(
      makeNewProduct({
        businessId: BIZ,
        seguirStock: false,
        precioVentaCentavos: 5_000n,
      }),
    );

    // Open caja with $500
    const turno = await h.useCases.abrirCaja.execute({
      userId: USER_ID,
      fecha: '2026-04-23',
      montoAperturaCentavos: 500_00n,
      efectivoAdicionalCentavos: 0n,
      businessId: BIZ,
    });
    turnoId = turno.id;

    // Register 2 cash sales ($50 each)
    for (let i = 0; i < 2; i++) {
      await h.useCases.registrarVenta.execute(
        makeNewSale({
          businessId: BIZ,
          productoId: product.id,
          monto: 50_00n,
          metodo: 'Efectivo',
        }),
      );
    }
  });

  it('prevents double open turno for same user', async () => {
    await expect(
      h.useCases.abrirCaja.execute({
        userId: USER_ID,
        fecha: '2026-04-23',
        montoAperturaCentavos: 100_00n,
        efectivoAdicionalCentavos: 0n,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/ya tienes un turno abierto/i);
  });

  it('retiro + depósito on open turno succeed', async () => {
    // Retiro $20
    const retiro = await h.useCases.retirarCaja.execute({
      turnoId,
      tipo: 'retiro',
      montoCentavos: 20_00n,
      motivo: 'Cambio para billetes',
      userId: USER_ID,
      businessId: BIZ,
    });
    expect(retiro.tipo).toBe('retiro');

    // Depósito $30
    const deposito = await h.useCases.depositarCaja.execute({
      turnoId,
      tipo: 'deposito',
      montoCentavos: 30_00n,
      motivo: 'Efectivo adicional',
      userId: USER_ID,
      businessId: BIZ,
    });
    expect(deposito.tipo).toBe('deposito');
  });

  it('close with discrepancy requires reason and gasto-no-registrado creates Egreso', async () => {
    // Close with $580 counted but expected is $600 (apertura $500 + 2×$50 sales)
    // The discrepancy is $580 - $600 = -$20
    // With reason 'gasto-no-registrado' → auto-creates Egreso of $20

    const closed = await h.useCases.cerrarCaja.execute({
      turnoId,
      montoCierreCentavos: 580_00n,
      discrepancyReason: 'gasto-no-registrado',
      explicacion: 'Compré servilletas',
      businessId: BIZ,
    });

    expect(closed.cierreAt).not.toBeNull();
    expect(closed.diferenciaCentavos).toBe(-20_00n);
    expect(closed.egresoAutoId).not.toBeNull();

    // Auto-egreso created with today() — find it by its ID directly
    // (today() returns the actual system date, not the turno date)
    const allEgresosForBiz = await h.repos.expenses.findByDate(
      new Date().toISOString().slice(0, 10) as never,
      BIZ,
    );
    const autoEgreso = allEgresosForBiz.find((e) => e.id === closed.egresoAutoId);
    expect(autoEgreso).toBeDefined();
    expect(autoEgreso!.monto).toBe(20_00n);
    expect(autoEgreso!.categoria).toBe('Otro');
  });

  it('close with discrepancy but no reason → rejected', async () => {
    await expect(
      h.useCases.cerrarCaja.execute({
        turnoId,
        montoCierreCentavos: 580_00n,
        discrepancyReason: null,
        explicacion: null,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/razón/i);
  });

  it('retiro on closed turno is rejected', async () => {
    // Close turno first (no discrepancy — exact match, reason still required as null)
    await h.useCases.cerrarCaja.execute({
      turnoId,
      montoCierreCentavos: 600_00n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });

    await expect(
      h.useCases.retirarCaja.execute({
        turnoId,
        tipo: 'retiro',
        montoCentavos: 10_00n,
        motivo: 'Too late',
        userId: USER_ID,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/turno cerrado/i);
  });

  it('depósito on closed turno is rejected', async () => {
    await h.useCases.cerrarCaja.execute({
      turnoId,
      montoCierreCentavos: 600_00n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });

    await expect(
      h.useCases.depositarCaja.execute({
        turnoId,
        tipo: 'deposito',
        montoCentavos: 10_00n,
        motivo: 'Too late',
        userId: USER_ID,
        businessId: BIZ,
      }),
    ).rejects.toThrow(/turno cerrado/i);
  });

  it('corte de día succeeds, then duplicate same day is rejected', async () => {
    // Close turno first
    await h.useCases.cerrarCaja.execute({
      turnoId,
      montoCierreCentavos: 600_00n,
      discrepancyReason: null,
      explicacion: null,
      businessId: BIZ,
    });

    // First corte succeeds
    const corte = await h.useCases.cerrarCorte.execute({
      fecha: '2026-04-23',
      businessId: BIZ,
      deviceId: TEST_DEVICE_ID,
      efectivoContadoCentavos: 600_00n,
      cerradoPor: 'Director',
    });

    expect(corte.fecha).toBe('2026-04-23');

    // Second corte same day → rejected
    await expect(
      h.useCases.cerrarCorte.execute({
        fecha: '2026-04-23',
        businessId: BIZ,
        deviceId: TEST_DEVICE_ID,
        efectivoContadoCentavos: 600_00n,
        cerradoPor: 'Director',
      }),
    ).rejects.toThrow(/ya existe un corte/i);
  });
});
