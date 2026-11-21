/**
 * The model copies the pace of the sample it hears (measured on 2026-11-21:
 * the same lines came out at 145, 166, 179 and 199 words a minute as the
 * sample was tightened). So the pace is set on the sample, not on the lines.
 * These tests hold what the sample is put through before the model hears it.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { VOZ_DON } from '../packages/guias/src/index.js';
import { RITMO_MAX, filtroRitmo } from './guias-voz-ritmo.js';

describe('filtroRitmo: what the sample goes through before the model hears it', () => {
  it('cuts the long pauses and plays the sample faster by the pace', () => {
    const filtro = filtroRitmo(1.15);
    assert.match(filtro, /^silenceremove=/);
    assert.match(filtro, /,atempo=1\.15$/);
  });

  it('only cuts the pauses at a pace of one: the sample says its words as fast as it did', () => {
    const filtro = filtroRitmo(1);
    assert.match(filtro, /^silenceremove=/);
    assert.doesNotMatch(filtro, /atempo/);
  });

  it('refuses a pace below one: the sample is already too slow', () => {
    assert.throws(() => filtroRitmo(0.9), /between 1 and/);
  });

  it('refuses a pace so fast the sample stops sounding like him', () => {
    assert.throws(() => filtroRitmo(RITMO_MAX + 0.01), /between 1 and/);
  });

  it('refuses a pace that is not a number', () => {
    assert.throws(() => filtroRitmo(Number.NaN), /between 1 and/);
  });
});

describe('the repository', () => {
  it('gives Don Cuentas a pace the sample can be tightened to', () => {
    assert.doesNotThrow(() => filtroRitmo(VOZ_DON.ritmo));
  });
});
