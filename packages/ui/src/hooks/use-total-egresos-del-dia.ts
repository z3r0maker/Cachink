/**
 * `useTotalEgresosDelDia` — derives the sum of egresos for a day.
 * Pure `totalEgresosDelDia(egresos)` + a React-memoized hook.
 */

import { useMemo } from 'react';
import type { Expense, Money } from '@cachink/domain';

export function totalEgresosDelDia(egresos: readonly Expense[]): Money {
  let total = 0n as Money;
  for (const egreso of egresos) {
    total = ((total as bigint) + (egreso.monto as bigint)) as Money;
  }
  return total;
}

export function useTotalEgresosDelDia(egresos: readonly Expense[]): Money {
  return useMemo(() => totalEgresosDelDia(egresos), [egresos]);
}
