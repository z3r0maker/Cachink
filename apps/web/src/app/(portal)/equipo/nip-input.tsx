'use client';

import { Input } from '@/components';

/**
 * The NIP field: masked like any secret, a number pad on phones, four digits
 * at most (ADR-072). The owner says it to the operator in person; the screen
 * does not show it to whoever stands behind them.
 */
export function NipInput(props: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly error?: string | undefined;
  readonly testId: string;
}) {
  return (
    <Input
      labelText={props.label}
      hintText="4 números"
      type="password"
      inputMode="numeric"
      autoComplete="new-password"
      maxLength={4}
      numeric
      value={props.value}
      onChange={(e) => props.onChange(e.target.value.replace(/\D/g, ''))}
      error={props.error}
      data-testid={props.testId}
    />
  );
}
