import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { saludo } from '../src/app/(portal)/_inicio/saludo';

/** The greeting names the account when it has a name and never shows a dangling comma (ADR-087). */
describe('saludo', () => {
  it('greets a named account', () => {
    assert.equal(saludo('Pedro'), 'Hola, Pedro');
  });

  it('greets an unnamed account without punctuation debris', () => {
    assert.equal(saludo(null), 'Hola');
    assert.equal(saludo(''), 'Hola');
  });
});
