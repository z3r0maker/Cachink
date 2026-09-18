import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { AvisoObligatorioError, type PreferenciasGuardadas } from '@xangarro/domain';

import { CambiarCanalAvisoUseCase } from '../src/avisos/index.js';

function port(initial: PreferenciasGuardadas = {}) {
  const saved: PreferenciasGuardadas[] = [];
  return {
    saved,
    leer: async () => initial,
    guardar: async (p: PreferenciasGuardadas) => {
      saved.push(p);
    },
  };
}

describe('CambiarCanalAvisoUseCase', () => {
  it('stores the switch on top of what was there and returns the matrix', async () => {
    const p = port({ stock_bajo: { portal: false } });
    const matrix = await new CambiarCanalAvisoUseCase(p).execute({
      tipo: 'stock_bajo',
      canal: 'correo',
      on: true,
    });
    assert.deepEqual(p.saved, [{ stock_bajo: { portal: false, correo: true } }]);
    assert.equal(matrix.find((r) => r.tipo === 'stock_bajo')?.correo, true);
  });

  it('refuses a critical aviso and stores nothing', async () => {
    const p = port();
    await assert.rejects(
      new CambiarCanalAvisoUseCase(p).execute({
        tipo: 'discrepancia_caja',
        canal: 'portal',
        on: false,
      }),
      AvisoObligatorioError,
    );
    assert.equal(p.saved.length, 0);
  });

  it('refuses an unknown type', async () => {
    await assert.rejects(
      new CambiarCanalAvisoUseCase(port()).execute({
        tipo: 'nada' as never,
        canal: 'correo',
        on: true,
      }),
      TypeError,
    );
  });

  it('propagates a storage failure', async () => {
    const p = { leer: async () => ({}), guardar: async () => Promise.reject(new Error('db')) };
    await assert.rejects(
      new CambiarCanalAvisoUseCase(p).execute({ tipo: 'stock_bajo', canal: 'correo', on: true }),
      /db/,
    );
  });
});
