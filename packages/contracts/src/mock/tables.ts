/**
 * The legacy bootstrap and the delta pull over `MockState` (§3, §5): every
 * row of every pullable table stored after `since`. A snapshot page is
 * `snapshot.ts`'s.
 */

import type { PullResponse } from '../sync-pull.js';
import type { MockState } from './state.js';

/** The tenant's feature-flag layer, on every pull and bootstrap. */
export const MOCK_FEATURE_FLAGS = { stock: true } as const;

export function referenceTables(state: MockState, since: number): PullResponse['tables'] {
  const pick = (t: string): Record<string, unknown>[] => state.rowsOf(t, since).map((r) => r.row);
  const users = state.rowsOf('users', since).map((r) => {
    const { email: _email, ...rest } = r.row;
    return rest;
  });
  return {
    businesses: pick('businesses'),
    products: pick('products'),
    clients: pick('clients'),
    users,
    employees: pick('employees'),
    recurring_expenses: pick('recurring_expenses'),
    conversion_recetas: pick('conversion_recetas'),
    inventory_movements: pick('inventory_movements'),
    mensajes_operador: pick('mensajes_operador'),
    opening_balances: pick('opening_balances'),
    opening_balance_clients: pick('opening_balance_clients'),
    feature_flags: MOCK_FEATURE_FLAGS,
  } as unknown as PullResponse['tables'];
}
