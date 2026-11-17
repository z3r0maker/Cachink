import type { Page } from '@playwright/test';
import { RegistrarMovimientoUseCase } from '@xangarro/application/corp';
import type { Movement } from '@xangarro/domain/corp';
import { createCorpDb, createCorpLedgerRepository } from '@xangarro/data-corp';

/**
 * E-12's Balance steps for empresa.spec.ts. The sheet is cumulative, so its
 * rows go in a year no other test writes: a partner's capital in May 2023,
 * then June's cobro and the other partner's loan. Each concept starts with
 * «E2E», so `clearLedgerFixture` takes them away.
 *
 * Worked by hand, at 30 June: Bancos 6,000 + 1,160 + 2,000 = 9,160; Pasivo
 * IVA 160 + loan 2,000 = 2,160; Capital 6,000 + the year's 1,000 = 7,000.
 */
export const MES_BALANCE = '2023-06';

const MOVIMIENTOS: readonly (readonly [string, Movement])[] = [
  ['2023-05-10', { kind: 'aportacion_capital', socio: 1, monto: 6_000_00n }],
  ['2023-06-05', { kind: 'cobro', subtotal: 1_000_00n, iva: 160_00n, destino: 'bancos' }],
  ['2023-06-08', { kind: 'prestamo_socio', socio: 2, monto: 2_000_00n }],
];

export async function sembrarBalance(): Promise<void> {
  const db = createCorpDb(process.env.CORP_DATABASE_URL ?? '', 1);
  const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(db));
  for (const [fecha, movement] of MOVIMIENTOS) {
    await registrar.execute({
      fecha,
      projectId: 'xangarro',
      concepto: `E2E Balance ${movement.kind}`,
      contraparte: null,
      founderId: 'e2e-balance',
      source: 'manual',
      sourceRef: `e2e-balance-${fecha}`,
      usd: null,
      deducible: null,
      movement,
    });
  }
  await db.$client.end({ timeout: 5 });
}

export const cuentaDelBalance = (page: Page, id: string) =>
  page.getByTestId(`balance-cuenta-${id}`);
