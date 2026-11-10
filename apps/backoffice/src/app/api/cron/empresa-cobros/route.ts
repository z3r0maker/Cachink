import { importarCobros } from '@xangarro/application/corp';
import { createCorpLedgerRepository } from '@xangarro/data-corp';

import { db } from '@/server/db/client';
import { corpDb, hoyEnMexico } from '@/server/db/corp';
import { handleCobrosCron } from '@/server/empresa/cron-cobros';
import { fuenteDeIngresos } from '@/server/empresa/ingresos-fuente';

/** Xangarro's Stripe payments into the corp ledger, daily (E-10); see `cron-cobros.ts`. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const corp = corpDb();
  return handleCobrosCron(request, {
    secret: process.env.CRON_SECRET,
    hoy: () => hoyEnMexico(),
    importar:
      corp === null
        ? null
        : (input) =>
            importarCobros(
              { ledger: createCorpLedgerRepository(corp), ingresos: fuenteDeIngresos(db()) },
              input,
            ),
  });
}
