import {
  assertReembolsoCabe,
  cuentasDeSocios,
  type JournalLine,
  type MovementKind,
} from '@xangarro/domain/corp';

import type { CorpLedgerRepository } from './ports.js';

/**
 * No entry may leave the company owing a partner less than nothing (E-03): a
 * repayment over the balance, or reversing a loan that was already partly
 * repaid, is refused. Loans carry no interest, so the balance is the plain
 * sum of the partner's loan lines.
 */
export async function assertPrestamosCubiertos(
  ledger: CorpLedgerRepository,
  kind: MovementKind,
  lines: readonly JournalLine[],
): Promise<void> {
  const reduces = lines.some((l) => l.cuenta === 'prestamos_socios' && l.debe > 0n);
  if (!reduces) return;
  const antes = cuentasDeSocios(await ledger.listPartnerEntries());
  const efecto = cuentasDeSocios([{ kind, lines }]);
  for (const socio of [1, 2] as const) {
    const baja = -efecto[socio].prestamo;
    if (baja > 0n) assertReembolsoCabe(antes[socio].prestamo, baja);
  }
}
