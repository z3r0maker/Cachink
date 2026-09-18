import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  ConfirmacionNombreError,
  SuscripcionActivaError,
  type SuscripcionHecho,
} from '@xangarro/domain';

import { ArchivarNegocioUseCase } from '../src/archivar-negocio/index.js';

function ports(subs: SuscripcionHecho[] = []) {
  let archived = 0;
  return {
    get archived() {
      return archived;
    },
    subscriptions: async () => subs,
    archive: async () => {
      archived += 1;
    },
  };
}

const run = (p: ReturnType<typeof ports>, confirmacion: string) =>
  new ArchivarNegocioUseCase(p).execute({ nombre: 'Taquería Don Pedro', confirmacion });

describe('ArchivarNegocioUseCase', () => {
  it('archives when the name is typed and nothing will charge', async () => {
    const p = ports([{ stripeStatus: 'canceled', cancelAt: null }]);
    await run(p, '  taquería don pedro ');
    assert.equal(p.archived, 1);
  });

  it('archives a subscription already set to end', async () => {
    const p = ports([{ stripeStatus: 'active', cancelAt: '2026-10-01T00:00:00Z' }]);
    await run(p, 'Taquería Don Pedro');
    assert.equal(p.archived, 1);
  });

  it('refuses a wrong name', async () => {
    const p = ports();
    await assert.rejects(run(p, 'Taqueria'), ConfirmacionNombreError);
    assert.equal(p.archived, 0);
  });

  it('refuses an empty confirmation', async () => {
    await assert.rejects(run(ports(), '   '), ConfirmacionNombreError);
  });

  it('refuses while a subscription will keep charging', async () => {
    const p = ports([{ stripeStatus: 'past_due', cancelAt: null }]);
    await assert.rejects(run(p, 'Taquería Don Pedro'), SuscripcionActivaError);
    assert.equal(p.archived, 0);
  });
});
