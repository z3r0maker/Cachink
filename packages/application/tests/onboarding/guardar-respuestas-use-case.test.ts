import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { GuardarRespuestasUseCase } from '../../src/index.js';
import { InMemoryOnboardingStore } from '../support/in-memory-onboarding.js';

function build() {
  const store = new InMemoryOnboardingStore();
  return { store, useCase: new GuardarRespuestasUseCase(store) };
}

describe('GuardarRespuestasUseCase (N-12)', () => {
  it('merges each step into what was already answered', async () => {
    const { store, useCase } = build();
    await useCase.execute({ patch: { nombre: 'Tortas Lupita', tipoNegocio: 'servicio' } });
    const saved = await useCase.execute({ patch: { manejaInventario: false } });

    assert.deepEqual(saved, {
      nombre: 'Tortas Lupita',
      tipoNegocio: 'servicio',
      manejaInventario: false,
    });
    assert.deepEqual(store.record?.answers, saved);
  });

  it('forgets the answers of a skipped step', async () => {
    const { useCase } = build();
    await useCase.execute({ patch: { manejaCajaEfectivo: true, vendeACredito: true } });
    const saved = await useCase.execute({ patch: {}, clear: ['manejaCajaEfectivo'] });
    assert.deepEqual(saved, { vendeACredito: true });
  });

  it('refuses an invalid value and keeps the stored answers', async () => {
    const { store, useCase } = build();
    await useCase.execute({ patch: { personasQueCobran: 2 } });
    await assert.rejects(useCase.execute({ patch: { whatsapp: '123' } }), {
      code: 'INVALID_WIZARD_ANSWERS',
    });
    assert.deepEqual(store.record?.answers, { personasQueCobran: 2 });
  });

  it('refuses contradictory answers across steps', async () => {
    const { store, useCase } = build();
    await useCase.execute({ patch: { metodosCobro: ['Efectivo', 'Crédito'] } });
    await assert.rejects(useCase.execute({ patch: { vendeACredito: false } }), {
      code: 'CONTRADICTORY_WIZARD_ANSWERS',
    });
    assert.equal(store.writes, 1);
  });

  it('refuses a key the wizard does not ask', async () => {
    const { useCase } = build();
    await assert.rejects(
      useCase.execute({ patch: { plan: 'xangarrote' } as unknown as Record<string, never> }),
      { code: 'INVALID_WIZARD_ANSWERS' },
    );
  });

  it('treats corrupt stored answers as a failure, not as a blank slate', async () => {
    const { store, useCase } = build();
    store.record = {
      answers: { manejaInventario: 'sí' },
      pendingPaidAnswers: [],
      completedAt: null,
      trialIntent: null,
    };
    await assert.rejects(useCase.execute({ patch: { hasLogo: true } }), {
      code: 'INVALID_WIZARD_ANSWERS',
    });
  });
});
