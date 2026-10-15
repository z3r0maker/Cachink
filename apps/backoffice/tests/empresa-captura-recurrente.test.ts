import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { leerCaptura } from '../src/server/empresa/captura';

/** E-02's «Hacer recurrente cada mes» and a suggestion being registered (board CD-03). */
const form =
  (fields: Record<string, string>) =>
  (name: string): string =>
    fields[name] ?? '';

const gasto = {
  tipo: 'gasto',
  fecha: '2026-10-28',
  concepto: 'Vercel',
  moneda: 'MXN',
  monto: '368.40',
  categoria: 'costo_servicio',
  proyecto: 'xangarro',
  nonce: 'manual-01J9',
};

describe('leerCaptura: recurring expenses', () => {
  it('names a new template after the form nonce when the box is ticked', () => {
    const r = leerCaptura(form({ ...gasto, recurrente: 'si' }), 'f-1');
    assert.ok(r.ok);
    assert.deepEqual(r.recurrencia, { tipo: 'nueva', id: 'rec-01J9' });
  });

  it('registers a suggestion against its template and month', () => {
    const r = leerCaptura(
      form({ ...gasto, plantilla: 'rec-VERCEL', mesPlantilla: '2026-10', recurrente: 'si' }),
      'f-1',
    );
    assert.ok(r.ok);
    assert.deepEqual(r.recurrencia, { tipo: 'existente', id: 'rec-VERCEL', mes: '2026-10' });
  });

  it('is a plain expense when the box is not ticked', () => {
    const r = leerCaptura(form(gasto), 'f-1');
    assert.ok(r.ok);
    assert.equal(r.recurrencia, null);
  });

  it('never repeats a bank fee, even with the box ticked', () => {
    const r = leerCaptura(
      form({
        tipo: 'comision',
        fecha: '2026-10-05',
        monto: '12.50',
        recurrente: 'si',
        nonce: 'manual-1',
      }),
      'f-1',
    );
    assert.ok(r.ok);
    assert.equal(r.recurrencia, null);
  });

  it('ignores a suggestion whose month is not one', () => {
    const r = leerCaptura(
      form({ ...gasto, plantilla: 'rec-VERCEL', mesPlantilla: '2026-13' }),
      'f-1',
    );
    assert.ok(r.ok);
    assert.equal(r.recurrencia, null);
  });
});
