/**
 * Auth-related query keys — shared between auth-gates.tsx and
 * quick-switch-gate.tsx to break the circular dependency.
 */

/** Query key for the users list. */
export const USERS_KEY = ['users'] as const;
