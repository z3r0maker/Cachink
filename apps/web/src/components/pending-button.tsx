'use client';

import { Button } from './button';

/**
 * A button for something that is designed but not yet built.
 *
 * The alternative — leaving it looking ordinary and doing nothing — is worse
 * than either shipping it or removing it: the shopkeeper clicks, nothing
 * happens, and they cannot tell a broken app from a slow one. This says so,
 * and `title` says what it is waiting on.
 *
 * Distinct from `ScreenState = 'proximamente'` (ADR-059), which gates a whole
 * surface on a capability the plan does not include. This is about work not
 * done yet, not about tiering.
 */
export function PendingButton({
  children,
  reason,
  variant = 'secondary',
}: {
  readonly children: string;
  /** What it is blocked on, in the shopkeeper's terms. */
  readonly reason: string;
  readonly variant?: 'primary' | 'secondary';
}) {
  return (
    <Button variant={variant} disabled title={reason} data-testid="pending-button">
      {children} · próximamente
    </Button>
  );
}
