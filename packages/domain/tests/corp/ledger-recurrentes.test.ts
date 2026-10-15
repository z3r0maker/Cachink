import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPlantilla,
  fechaDeCargo,
  leerRefRecurrente,
  PlantillaInvalidaError,
  recurrentesDelMes,
  refRecurrente,
  type PlantillaRecurrente,
} from '../../src/corp/ledger/index.js';

/** E-02's recurring templates: a monthly service suggests its charge until it is registered. */
const vercel: PlantillaRecurrente = {
  id: 'rec-vercel',
  nombre: 'Vercel',
  contraparte: 'Vercel Inc.',
  categoria: 'costo_servicio',
  moneda: 'USD',
  montoEstimado: 20_00n,
  diaCargo: 28,
  projectId: 'xangarro',
  deducible: true,
  activo: true,
  desde: '2026-09',
};

const contador: PlantillaRecurrente = {
  ...vercel,
  id: 'rec-contador',
  nombre: 'Contador',
  contraparte: null,
  categoria: 'administracion',
  moneda: 'MXN',
  montoEstimado: 3_500_00n,
  diaCargo: 12,
  projectId: null,
};

describe('fechaDeCargo', () => {
  it('is the charge day of the month', () => {
    assert.equal(fechaDeCargo(28, '2026-09'), '2026-09-28');
    assert.equal(fechaDeCargo(5, '2026-10'), '2026-10-05');
  });

  it('falls on the last day of a shorter month', () => {
    assert.equal(fechaDeCargo(31, '2026-09'), '2026-09-30');
    assert.equal(fechaDeCargo(30, '2027-02'), '2027-02-28');
    assert.equal(fechaDeCargo(29, '2028-02'), '2028-02-29');
  });

  it('refuses a day outside 1–31 or a month that is not one', () => {
    assert.throws(() => fechaDeCargo(0, '2026-09'), PlantillaInvalidaError);
    assert.throws(() => fechaDeCargo(32, '2026-09'), PlantillaInvalidaError);
    assert.throws(() => fechaDeCargo(1.5, '2026-09'), PlantillaInvalidaError);
    assert.throws(() => fechaDeCargo(10, '2026-13'), PlantillaInvalidaError);
  });
});

describe('refRecurrente', () => {
  it('names the template and the month it pays, and reads back', () => {
    const ref = refRecurrente('rec-vercel', '2026-09', 'manual-01J');
    assert.equal(ref, 'rec-vercel:2026-09:manual-01J');
    assert.deepEqual(leerRefRecurrente(ref), { plantillaId: 'rec-vercel', mes: '2026-09' });
  });

  it('reads nothing from a ref that is not a recurring one', () => {
    assert.equal(leerRefRecurrente('manual-01J'), null);
    assert.equal(leerRefRecurrente('rec-vercel:2026-9:x'), null);
    assert.equal(leerRefRecurrente(':2026-09:x'), null);
  });

  it('refuses a template id or nonce that would break the ref apart', () => {
    assert.throws(() => refRecurrente('rec:x', '2026-09', 'n'), PlantillaInvalidaError);
    assert.throws(() => refRecurrente('rec-x', '2026-09', ''), PlantillaInvalidaError);
  });
});

describe('assertPlantilla', () => {
  it('accepts a named service with an amount and a charge day', () => {
    assertPlantilla(vercel);
  });

  it('refuses an empty name', () => {
    assert.throws(() => assertPlantilla({ ...vercel, nombre: '  ' }), PlantillaInvalidaError);
  });

  it('refuses an amount of zero or less', () => {
    assert.throws(() => assertPlantilla({ ...vercel, montoEstimado: 0n }), PlantillaInvalidaError);
    assert.throws(() => assertPlantilla({ ...vercel, montoEstimado: -1n }), PlantillaInvalidaError);
  });

  it('refuses a charge day outside 1–31 and a start that is not a month', () => {
    assert.throws(() => assertPlantilla({ ...vercel, diaCargo: 0 }), PlantillaInvalidaError);
    assert.throws(() => assertPlantilla({ ...vercel, desde: '2026-9' }), PlantillaInvalidaError);
  });
});

describe('recurrentesDelMes', () => {
  const none = new Map<string, string>();

  it('suggests a charge whose day has come, and lists one still to come as próximo', () => {
    const r = recurrentesDelMes([vercel, contador], none, '2026-10', '2026-10-15');
    assert.deepEqual(
      r.map((x) => [x.plantilla.id, x.fecha, x.estado]),
      [
        ['rec-contador', '2026-10-12', 'sugerido'],
        ['rec-vercel', '2026-10-28', 'proximo'],
      ],
    );
  });

  it('marks a registered charge with the entry that paid it', () => {
    const r = recurrentesDelMes([vercel], new Map([['rec-vercel', 'E1']]), '2026-10', '2026-10-30');
    assert.equal(r[0]?.estado, 'registrado');
    assert.equal(r[0]?.entryId, 'E1');
  });

  it('suggests every unregistered charge of a past month, and nothing before a template began', () => {
    const r = recurrentesDelMes([vercel, contador], none, '2026-09', '2026-11-02');
    assert.deepEqual(
      r.map((x) => x.estado),
      ['sugerido', 'sugerido'],
    );
    assert.deepEqual(recurrentesDelMes([vercel], none, '2026-08', '2026-11-02'), []);
  });

  it('leaves out a stopped template unless it was registered that month', () => {
    const parado = { ...vercel, activo: false };
    assert.deepEqual(recurrentesDelMes([parado], none, '2026-10', '2026-10-30'), []);
    const pagado = recurrentesDelMes(
      [parado],
      new Map([['rec-vercel', 'E9']]),
      '2026-10',
      '2026-10-30',
    );
    assert.equal(pagado[0]?.estado, 'registrado');
  });

  it('lists a future month as próximo, never as sugerido', () => {
    const r = recurrentesDelMes([contador], none, '2026-12', '2026-10-15');
    assert.equal(r[0]?.estado, 'proximo');
  });
});
