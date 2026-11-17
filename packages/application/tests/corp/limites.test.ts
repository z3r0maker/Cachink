import assert from 'node:assert/strict';
import { TopeInvalidoError, type TopesDelAnio } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import { guardarTopes, type TopesRepository } from '../../src/corp/limites.js';

/** E-15: a founder captures a year's caps (board CD-12d, «Enero sin el tope de 2027»). */
function fake(fallar = false) {
  const guardados: { t: TopesDelAnio; founderId: string }[] = [];
  const repo: TopesRepository = {
    topes: async () => guardados.map((g) => g.t),
    guardar: async (t, founderId) => {
      if (fallar) throw new Error('corp is down');
      guardados.push({ t, founderId });
    },
  };
  return { repo, guardados };
}

const TOPES = { anio: 2027, sas: 800_000_000n, resico: 3_500_000_000n };

describe('guardarTopes', () => {
  it("keeps the year's two caps with who captured them", async () => {
    const f = fake();
    const t = await guardarTopes({ topes: f.repo }, { ...TOPES, founderId: 'f1' });
    assert.deepEqual(t, TOPES);
    assert.deepEqual(f.guardados, [{ t: TOPES, founderId: 'f1' }]);
  });

  it('refuses a cap at zero, and keeps nothing', async () => {
    const f = fake();
    await assert.rejects(
      guardarTopes({ topes: f.repo }, { ...TOPES, sas: 0n, founderId: 'f1' }),
      TopeInvalidoError,
    );
    assert.equal(f.guardados.length, 0);
  });

  it('refuses a year outside the range', async () => {
    const f = fake();
    await assert.rejects(
      guardarTopes({ topes: f.repo }, { ...TOPES, anio: 3000, founderId: 'f1' }),
      TopeInvalidoError,
    );
  });

  it("lets the store's failure through for the console to report", async () => {
    await assert.rejects(
      guardarTopes({ topes: fake(true).repo }, { ...TOPES, founderId: 'f1' }),
      /corp is down/,
    );
  });
});
