import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ExpenseNotFoundError } from '../../src/index.js';

describe('ExpenseNotFoundError (M-18)', () => {
  it('names the gasto and says so in the screen’s words', () => {
    const e = new ExpenseNotFoundError('01HZ8XQN9GZJXV8AKQ5X0C7GS1');
    assert.equal(e.code, 'EXPENSE_NOT_FOUND');
    assert.equal(e.id, '01HZ8XQN9GZJXV8AKQ5X0C7GS1');
    assert.equal(e.name, 'ExpenseNotFoundError');
    assert.ok(e instanceof Error);
    assert.match(e.message, /gasto ya no existe/);
  });
});
