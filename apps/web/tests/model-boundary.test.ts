import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { clienteModelo, modeloId, modelConfigurado, type LlmEnv } from '../src/server/asesor/model';

/**
 * P-30's boundary: the single module that knows a model exists. Unset env →
 * null (fixtures + the closed gate, everywhere from CI to production); set env
 * → a client pointed at the gateway, with the model id overridable because the
 * local proxy serves the 4.x line while ADR-056 names opus-5.
 */
describe('model boundary (P-30)', () => {
  it('unset env answers null and the gate stays closed', () => {
    const env: LlmEnv = {};
    assert.equal(clienteModelo(env), null);
    assert.equal(modelConfigurado(env), false);
  });

  it('an empty string is as good as unset (a fresh clone)', () => {
    const env: LlmEnv = { ASESOR_LLM_BASE_URL: '', ASESOR_LLM_API_KEY: '' };
    assert.equal(modelConfigurado(env), false);
  });

  it('half a credential is no credential', () => {
    assert.equal(modelConfigurado({ ASESOR_LLM_BASE_URL: 'http://x' }), false);
    assert.equal(modelConfigurado({ ASESOR_LLM_API_KEY: 'k' }), false);
  });

  it('both vars construct a live client', () => {
    const env: LlmEnv = { ASESOR_LLM_BASE_URL: 'http://localhost:3456', ASESOR_LLM_API_KEY: 'k' };
    const c = clienteModelo(env);
    assert.ok(c !== null);
    assert.equal(modelConfigurado(env), true);
  });

  it('the model id defaults to ADR-056 and the env overrides it', () => {
    assert.equal(modeloId({}), 'claude-opus-5');
    assert.equal(modeloId({ ASESOR_LLM_MODEL: 'claude-opus-4-6' }), 'claude-opus-4-6');
  });
});
