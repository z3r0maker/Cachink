/**
 * `useTotalDelDia` — derives the total for a given day's sales. Pure
 * function wrapped as a hook so React Query invalidations drive updates
 * without an extra derived-state layer.
 */

import { useMemo } from 'react';
import type { Sale, Money } from '@cachink/domain';

export function totalDelDia(ventas: readonly Sale[]): Money {
  let total = 0n as Money;
  for (const venta of ventas) {
    total = ((total as bigint) + (venta.monto as bigint)) as Money;
  }
  return total;
}

export function useTotalDelDia(ventas: readonly Sale[]): Money {
  return useMemo(() => totalDelDia(ventas), [ventas]);
}
