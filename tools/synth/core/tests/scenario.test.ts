import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { ScenarioSchema } from '../src/schemas/scenario';
import { PRIMERA_VENTA } from './fixtures';
import { failingPaths, issues, withPatch } from './helpers';

describe('ScenarioSchema', () => {
  it('accepts the corrected example', () => {
    assert.deepEqual(issues(ScenarioSchema, PRIMERA_VENTA), []);
  });

  it('accepts the phone runner when the actor signs in as an operator', () => {
    const phone = withPatch(PRIMERA_VENTA, {
      runner: 'phone',
      start: { seed: 'negocio-con-catalogo-minimo', auth_as: 'operador', url: '/' },
    });
    assert.deepEqual(issues(ScenarioSchema, phone), []);
  });

  it('refuses the phone runner for a member role: the capture app has no owner sign-in (ADR-053)', () => {
    const phone = withPatch(PRIMERA_VENTA, {
      runner: 'phone',
      start: { seed: 'vacio', auth_as: 'owner', url: '/' },
    });
    assert.deepEqual(failingPaths(ScenarioSchema, phone), ['start.auth_as']);
  });

  it('refuses success judged in prose: each check is a named SQL assertion', () => {
    const prose = withPatch(PRIMERA_VENTA, {
      success: [{ type: 'db', assert: 'existe 1 venta con 2 partidas' }],
    });
    assert.ok(failingPaths(ScenarioSchema, prose).some((p) => p.startsWith('success.0')));
    assert.deepEqual(failingPaths(ScenarioSchema, withPatch(PRIMERA_VENTA, { success: [] })), [
      'success',
    ]);
  });

  it('refuses a seed, role or runner the harness does not have, and «director»', () => {
    const bad = withPatch(PRIMERA_VENTA, {
      runner: 'ios',
      start: { seed: 'negocio-grande', auth_as: 'director', url: '/' },
    });
    assert.deepEqual(failingPaths(ScenarioSchema, bad).sort(), [
      'runner',
      'start.auth_as',
      'start.seed',
    ]);
  });

  it('refuses an absolute URL: the runner owns the host (allowed_hosts)', () => {
    const bad = withPatch(PRIMERA_VENTA, {
      start: { seed: 'vacio', auth_as: 'owner', url: 'https://xangarro.mx/' },
    });
    assert.deepEqual(failingPaths(ScenarioSchema, bad), ['start.url']);
  });

  it('accepts «sin-cuenta» for a web signup: the actor becomes the owner at /signup', () => {
    const signup = withPatch(PRIMERA_VENTA, {
      start: { seed: 'sin-cuenta', auth_as: 'owner', url: '/signup' },
    });
    assert.deepEqual(issues(ScenarioSchema, signup), []);
  });

  it('refuses «sin-cuenta» starting anywhere but /signup, since there is no door to walk', () => {
    for (const url of ['/', '/login', '/bienvenida']) {
      const bad = withPatch(PRIMERA_VENTA, {
        start: { seed: 'sin-cuenta', auth_as: 'owner', url },
      });
      assert.deepEqual(failingPaths(ScenarioSchema, bad), ['start.url'], url);
    }
  });

  it('refuses «sin-cuenta» for any role but the owner a signup makes', () => {
    for (const auth_as of ['admin', 'viewer', 'operador']) {
      const bad = withPatch(PRIMERA_VENTA, {
        start: { seed: 'sin-cuenta', auth_as, url: '/signup' },
      });
      assert.deepEqual(failingPaths(ScenarioSchema, bad), ['start.auth_as'], auth_as);
    }
  });

  it('refuses «sin-cuenta» on the phone: the capture app has no signup', () => {
    const bad = withPatch(PRIMERA_VENTA, {
      runner: 'phone',
      start: { seed: 'sin-cuenta', auth_as: 'operador', url: '/signup' },
    });
    assert.ok(failingPaths(ScenarioSchema, bad).includes('runner'));
  });

  it('refuses an empty mission, zero optimal steps and an empty applies_to', () => {
    const bad = withPatch(PRIMERA_VENTA, { mission: ' ', optimal_steps: 0, applies_to: [] });
    assert.deepEqual(failingPaths(ScenarioSchema, bad).sort(), [
      'applies_to',
      'mission',
      'optimal_steps',
    ]);
  });
});
