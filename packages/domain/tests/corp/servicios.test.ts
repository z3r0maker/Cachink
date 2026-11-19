import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import type { PlantillaRecurrente } from '../../src/corp/ledger/index.js';
import {
  assertServicio,
  conPlantillasSueltas,
  estadoVisible,
  plantillaDeServicio,
  servicioDePlantilla,
  ServicioInvalidoError,
  type Servicio,
} from '../../src/corp/servicios/index.js';
import { fijo } from './servicios-fixture.js';

/** E-24, boards CD-18 and CD-18d: what each way of charging needs, and its template. */
const uso: Servicio = {
  ...fijo,
  id: 'srv-azure',
  cobro: 'uso',
  moneda: 'MXN',
  monto: null,
  diaCargo: 3,
  aviso: 2_500_00n,
};
const gratis: Servicio = {
  ...fijo,
  id: 'srv-supabase',
  cobro: 'gratis',
  monto: null,
  diaCargo: null,
  limite: 500,
  usoPlan: 310,
  unidad: 'MB',
  plantillaId: null,
};
const anual: Servicio = {
  ...fijo,
  id: 'srv-apple',
  cobro: 'anual',
  monto: 99_00n,
  diaCargo: null,
  renueva: '2027-09-10',
};

describe('assertServicio', () => {
  it('takes each way of charging with what it needs', () => {
    for (const s of [
      fijo,
      uso,
      gratis,
      anual,
      { ...fijo, cobro: 'comision' as const, tarifa: '3.6 % + $3' },
    ]) {
      assert.doesNotThrow(() => assertServicio(s));
    }
  });

  it('refuses a service without a name, or a fixed one without its amount or day', () => {
    assert.throws(() => assertServicio({ ...fijo, nombre: '  ' }), ServicioInvalidoError);
    assert.throws(() => assertServicio({ ...fijo, monto: 0n }), ServicioInvalidoError);
    assert.throws(() => assertServicio({ ...fijo, diaCargo: 32 }), ServicioInvalidoError);
  });

  it("refuses a month's reading without its date, or an alert at zero", () => {
    assert.throws(() => assertServicio({ ...uso, gastoMes: 100n }), ServicioInvalidoError);
    assert.throws(
      () => assertServicio({ ...uso, gastoMes: 100n, gastoAl: '2026-02-30' }),
      ServicioInvalidoError,
    );
    assert.throws(() => assertServicio({ ...uso, aviso: 0n }), ServicioInvalidoError);
  });

  it('refuses a free plan without its limit, a renewal without its date, a commission without its rate', () => {
    assert.throws(() => assertServicio({ ...gratis, limite: 0 }), ServicioInvalidoError);
    assert.throws(() => assertServicio({ ...anual, renueva: null }), ServicioInvalidoError);
    assert.throws(
      () => assertServicio({ ...fijo, cobro: 'comision', tarifa: '' }),
      ServicioInvalidoError,
    );
  });
});

describe('plantillaDeServicio', () => {
  it('charges a fixed one every month from this month, in its own currency', () => {
    assert.deepEqual(plantillaDeServicio(fijo, '2026-10-08'), {
      nombre: 'Vercel',
      categoria: 'costo_servicio',
      moneda: 'USD',
      montoEstimado: 20_00n,
      diaCargo: 28,
      periodicidad: 'mensual',
      desde: '2026-10',
    });
  });

  it('leaves the amount of a usage one to the charge, and an annual one to its renewal', () => {
    assert.equal(plantillaDeServicio(uso, '2026-10-08')?.montoEstimado, 0n);
    const a = plantillaDeServicio(anual, '2026-10-08');
    assert.deepEqual([a?.periodicidad, a?.desde, a?.diaCargo], ['anual', '2027-09', 10]);
  });

  it('gives none to a free plan, a commission, or a service not contracted or dropped', () => {
    assert.equal(plantillaDeServicio(gratis, '2026-10-08'), null);
    assert.equal(plantillaDeServicio({ ...fijo, cobro: 'comision' }, '2026-10-08'), null);
    assert.equal(plantillaDeServicio({ ...fijo, estado: 'por_contratar' }, '2026-10-08'), null);
    assert.equal(plantillaDeServicio({ ...fijo, estado: 'baja' }, '2026-10-08'), null);
  });
});

const contador: PlantillaRecurrente = {
  id: 'rec-contador',
  nombre: 'Contador',
  contraparte: 'Despacho Ruiz',
  rfc: null,
  categoria: 'administracion',
  moneda: 'MXN',
  montoEstimado: 3_500_00n,
  diaCargo: 12,
  projectId: null,
  deducible: true,
  activo: true,
  desde: '2026-05',
};

describe('conPlantillasSueltas', () => {
  it('reads a template no service owns as a fixed service under its own id', () => {
    const [s] = conPlantillasSueltas([], [contador]);
    assert.equal(s?.id, 'rec-contador');
    assert.equal(s?.cobro, 'fijo');
    assert.equal(s?.monto, 3_500_00n);
    assert.equal(s?.plantillaId, 'rec-contador');
  });

  it('never lists a template twice once a service owns it', () => {
    const vercel = { ...contador, id: 'rec-vercel', nombre: 'Vercel' };
    assert.deepEqual(
      conPlantillasSueltas([fijo], [vercel, contador]).map((s) => s.id),
      ['rec-contador', 'srv-vercel'],
    );
  });

  it('reads an annual template as annual, one without an amount as usage, a stopped one as dropped', () => {
    assert.equal(
      servicioDePlantilla({ ...contador, periodicidad: 'anual', desde: '2027-09', diaCargo: 10 })
        .renueva,
      '2027-09-10',
    );
    assert.equal(servicioDePlantilla({ ...contador, montoEstimado: 0n }).cobro, 'uso');
    assert.equal(servicioDePlantilla({ ...contador, activo: false }).estado, 'baja');
  });
});

describe('estadoVisible', () => {
  it('says a free plan is near its limit at 60 %', () => {
    assert.equal(estadoVisible(gratis, false), 'cerca_del_limite');
    assert.equal(estadoVisible({ ...gratis, usoPlan: 299 }, false), 'activo');
  });

  it('calls a paid service new until it posts, and keeps the stored states', () => {
    assert.equal(estadoVisible(fijo, false), 'nuevo');
    assert.equal(estadoVisible(fijo, true), 'activo');
    assert.equal(estadoVisible({ ...fijo, estado: 'por_contratar' }, false), 'por_contratar');
    assert.equal(estadoVisible({ ...fijo, estado: 'baja' }, true), 'baja');
  });
});
