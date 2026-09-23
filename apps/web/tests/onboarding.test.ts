import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { REASON_CODES } from '@xangarro/domain';

import { changeLine } from '../src/onboarding/change-copy';
import { buildChecklist, type ChecklistSignals } from '../src/onboarding/checklist';
import {
  REASON_COPY,
  allowedFor,
  displayedPlan,
  headline,
  joinReasons,
  priceLabel,
} from '../src/onboarding/plan-copy';
import { STEPS, reconcile, skipKeys, stepLabel } from '../src/onboarding/wizard-steps';

describe('"Tu plan ideal" copy (N-13)', () => {
  it('has Spanish for every reason code the domain can return', () => {
    for (const code of REASON_CODES) assert.ok(REASON_COPY[code].length > 0, code);
  });

  it('joins reasons the way a person would say them', () => {
    assert.equal(joinReasons(['INVENTARIO']), 'manejas inventario');
    assert.equal(
      joinReasons(['INVENTARIO', 'VENTAS_A_CREDITO', 'MAS_PERSONAS']),
      'manejas inventario, vendes a crédito y cobran varias personas',
    );
    assert.equal(
      headline('xangarro', ['INVENTARIO', 'VENTAS_A_CREDITO']),
      'Tu plan ideal: Xangarro — porque manejas inventario y vendes a crédito',
    );
    assert.equal(headline('xangarrito', []), 'Tu plan ideal: Xangarrito');
  });

  it('shows every paid price plus IVA; annual is ten months', () => {
    assert.equal(priceLabel('xangarro', 'mensual'), '$199 al mes + IVA');
    assert.equal(priceLabel('xangarrote', 'mensual'), '$399 al mes + IVA');
    assert.equal(priceLabel('xangarro', 'anual'), '$1,990 al año + IVA');
    assert.equal(priceLabel('xangarrote', 'anual'), '$3,990 al año + IVA');
    assert.equal(priceLabel('xangarrito', 'anual'), 'Gratis');
  });

  it('lets ?plan= preselect a bigger plan, never a smaller one or an unknown one', () => {
    assert.equal(displayedPlan('xangarro', 'xangarrote'), 'xangarrote');
    assert.equal(displayedPlan('xangarro', 'xangarrito'), 'xangarro');
    assert.equal(displayedPlan('xangarrito', 'premium'), 'xangarrito');
    assert.equal(displayedPlan('xangarrito', undefined), 'xangarrito');
  });

  it('allows only what is released and in the plan', () => {
    assert.deepEqual([...allowedFor('xangarrito')], []);
    assert.deepEqual([...allowedFor('xangarro')], ['stock', 'barcode']);
  });
});

describe('"esto cambiará" lines (N-15)', () => {
  it('reassures that switching Inventario off deletes nothing', () => {
    assert.equal(
      changeLine({ kind: 'feature', key: 'stock', enabled: false }),
      'Se desactivará Inventario / Stock — tus productos no se borran',
    );
    assert.equal(
      changeLine({ kind: 'feature', key: 'barcode', enabled: true }),
      'Se activará Lector de código de barras',
    );
    assert.equal(
      changeLine({ kind: 'paymentType', method: 'QR/CoDi', enabled: false }),
      'Se quitará QR/CoDi de tus formas de cobro',
    );
  });
});

describe('the wizard steps (N-12)', () => {
  it('is eight steps, each labelled "Paso N de 8" and each skippable', () => {
    assert.equal(STEPS.length, 8);
    assert.equal(stepLabel(0), 'Paso 1 de 8');
    assert.equal(stepLabel(7), 'Paso 8 de 8');
    for (let i = 0; i < 8; i += 1) assert.ok(skipKeys(i).length > 0);
  });

  it('"no vendo a crédito" takes Crédito out of the payment methods', () => {
    const r = reconcile({ metodosCobro: ['Efectivo', 'Crédito'] }, { vendeACredito: false });
    assert.deepEqual(r.patch, { vendeACredito: false, metodosCobro: ['Efectivo'] });
    assert.deepEqual(r.clear, []);
  });

  it('clears the payment methods rather than saving an empty list', () => {
    const r = reconcile({ metodosCobro: ['Crédito'] }, { vendeACredito: false });
    assert.deepEqual(r.patch, { vendeACredito: false });
    assert.deepEqual(r.clear, ['metodosCobro']);
  });

  it('choosing Crédito after "no" turns the credit answer to "sí"', () => {
    const r = reconcile({ vendeACredito: false }, { metodosCobro: ['Tarjeta', 'Crédito'] });
    assert.deepEqual(r.patch, { metodosCobro: ['Tarjeta', 'Crédito'], vendeACredito: true });
  });
});

describe('"¿Cómo empiezo?" (N-14)', () => {
  const NOTHING: ChecklistSignals = {
    operadores: 0,
    productos: 0,
    saldosIniciales: false,
    codigoGenerado: false,
    dispositivosActivos: 0,
    ventasSincronizadas: 0,
    tieneLogo: false,
  };

  it('starts at zero of seven and ends complete', () => {
    assert.equal(buildChecklist(NOTHING).done, 0);
    assert.equal(buildChecklist(NOTHING).total, 7);
    const all = buildChecklist({
      operadores: 1,
      productos: 3,
      saldosIniciales: true,
      codigoGenerado: true,
      dispositivosActivos: 1,
      ventasSincronizadas: 1,
      tieneLogo: true,
    });
    assert.equal(all.complete, true);
  });

  it('marks saldos iniciales from the captured opening, and links to the screen (N-17)', () => {
    const c = buildChecklist({ ...NOTHING, saldosIniciales: true });
    const saldos = c.items.find((i) => i.key === 'saldos');
    assert.equal(saldos?.done, true);
    assert.equal(saldos?.href, '/saldos-iniciales');
    assert.equal(buildChecklist(NOTHING).items.find((i) => i.key === 'saldos')?.done, false);
  });

  it('counts the code as done once a phone is activated, even after it expired', () => {
    const c = buildChecklist({ ...NOTHING, dispositivosActivos: 1 });
    const done = c.items.filter((i) => i.done).map((i) => i.key);
    assert.deepEqual(done, ['codigo', 'dispositivo']);
  });
});
