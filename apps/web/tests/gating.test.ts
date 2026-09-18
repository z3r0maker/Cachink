import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  asesorShowsDiagnostico,
  canExport,
  canWrite,
  hasStatements,
  isOwner,
  resolveScreenState,
} from '../src/session/gating';
import type { Capabilities } from '../src/session/types';

const XANGARRITO: Capabilities = {
  estadosFinancieros: false,
  informeMensual: false,
  permisosPorUsuario: false,
  asesor: 'semanal',
};
const XANGARROTE: Capabilities = {
  estadosFinancieros: true,
  informeMensual: true,
  permisosPorUsuario: true,
  asesor: 'completo',
};

describe('role gating', () => {
  it('lets owner and admin write', () => {
    assert.equal(canWrite('owner'), true);
    assert.equal(canWrite('admin'), true);
  });

  it('never lets a viewer write', () => {
    assert.equal(canWrite('viewer'), false);
  });

  it('restricts billing and business edits to the owner', () => {
    assert.equal(isOwner('owner'), true);
    assert.equal(isOwner('admin'), false);
    assert.equal(isOwner('viewer'), false);
  });

  it('keeps export open to every role — including the contador', () => {
    assert.equal(canExport(), true);
  });
});

describe('resolveScreenState', () => {
  it('renders content when everything is fine', () => {
    assert.equal(resolveScreenState({}), 'happy');
  });

  it('shows the upsell before anything else when the plan excludes the feature', () => {
    // Even mid-load and mid-error: an unentitled screen must not flash content.
    assert.equal(resolveScreenState({ entitled: false, loading: true }), 'locked');
    assert.equal(resolveScreenState({ entitled: false, error: true }), 'locked');
  });

  it('shows «Próximamente» for an LLM surface with the gate closed', () => {
    assert.equal(resolveScreenState({ llmBacked: true, llmEnabled: false }), 'proximamente');
    assert.equal(resolveScreenState({ llmBacked: true, llmEnabled: true }), 'happy');
  });

  it('prefers error over loading, and loading over empty', () => {
    assert.equal(resolveScreenState({ error: true, loading: true }), 'error');
    assert.equal(resolveScreenState({ loading: true, isEmpty: true }), 'loading');
    assert.equal(resolveScreenState({ isEmpty: true }), 'empty');
  });
});

describe('plan capabilities', () => {
  it('gives Xangarrito no NIF statements', () => {
    assert.equal(hasStatements(XANGARRITO), false);
  });

  it('gives Xangarrote statements and the full Asesor', () => {
    assert.equal(hasStatements(XANGARROTE), true);
    assert.equal(asesorShowsDiagnostico(XANGARROTE), true);
  });

  it('withholds the Diagnóstico below the top tier', () => {
    assert.equal(asesorShowsDiagnostico(XANGARRITO), false);
    assert.equal(asesorShowsDiagnostico({ ...XANGARROTE, asesor: 'diario' }), false);
  });
});
