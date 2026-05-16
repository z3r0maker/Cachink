/**
 * useNumpadInput — state management for the numpad component.
 *
 * Manages a string representation of the entered amount, handles
 * key presses (digits, decimal, backspace), and converts to centavos.
 * Max 2 decimal places enforced.
 */

import { useCallback, useState } from 'react';
import { fromPesos, type Money, ZERO } from '@cachink/domain';
import type { NumpadKey } from './numpad';

export interface NumpadInputState {
  /** Raw display string, e.g. "500.00" or "" */
  readonly raw: string;
  /** Formatted display string with $, e.g. "$500.00" */
  readonly display: string;
  /** Amount in centavos. ZERO when empty or invalid. */
  readonly centavos: Money;
  /** Handle a numpad key press. */
  readonly onKey: (key: NumpadKey) => void;
  /** Set amount directly from centavos (for quick-amounts). */
  readonly setFromCentavos: (c: Money) => void;
  /** Reset to empty. */
  readonly reset: () => void;
}

/**
 * Always shows 2 decimal places in the display string so the
 * operator sees "$500.00" not "$500". While the user is actively
 * typing decimals, the display respects what they've typed so far
 * but pads to 2 digits (e.g. "5.1" → "$5.10").
 */
function formatDisplay(raw: string): string {
  const DOLLAR = '$';
  if (raw === '' || raw === '0.') return DOLLAR + '0.00';
  if (raw.includes('.')) {
    const parts = raw.split('.');
    const int = parts[0] ?? '0';
    const dec = (parts[1] ?? '').padEnd(2, '0');
    return DOLLAR + int + '.' + dec;
  }
  return DOLLAR + raw + '.00';
}

export function useNumpadInput(): NumpadInputState {
  const [raw, setRaw] = useState('');

  const onKey = useCallback((key: NumpadKey) => {
    setRaw((prev) => {
      if (key === 'backspace') {
        return prev.slice(0, -1);
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      // Digit
      const next = prev + key;
      // Enforce max 2 decimal places
      const dotIdx = next.indexOf('.');
      if (dotIdx !== -1 && next.length - dotIdx > 3) {
        return prev;
      }
      // Prevent leading zeros (except "0.")
      if (next.length > 1 && next[0] === '0' && next[1] !== '.') {
        return next.slice(1);
      }
      return next;
    });
  }, []);

  const setFromCentavos = useCallback((c: Money) => {
    const pesos = Number(c) / 100;
    setRaw(pesos % 1 === 0 ? pesos.toString() : pesos.toFixed(2));
  }, []);

  const reset = useCallback(() => setRaw(''), []);

  let centavos: Money = ZERO;
  try {
    if (raw !== '' && raw !== '0.') {
      centavos = fromPesos(raw);
    }
  } catch {
    // Invalid input — keep ZERO
  }

  const display = formatDisplay(raw);

  return { raw, display, centavos, onKey, setFromCentavos, reset };
}
