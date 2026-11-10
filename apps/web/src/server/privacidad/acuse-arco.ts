import 'server-only';

import type { AcuseArco } from '@xangarro/application/support-inbox';
import { renderArcoAcuseEmail } from '@xangarro/email';

import { portalEmailSender, sendReported } from '../email/sender';
import { reportError } from '../observability/report';

const SCOPE = { endpoint: 'privacidad/arco-acuse' } as const;

/**
 * The ARCO acuse email (Reglamento art. 95), to the address the titular gave.
 * Keyed by folio, so a retry never sends it twice. It never throws: the
 * request is already filed, and a failure is reported by ids only (B-18).
 */
export async function enviarAcuseArco(acuse: AcuseArco): Promise<void> {
  try {
    const content = await renderArcoAcuseEmail(acuse);
    await sendReported(
      portalEmailSender(),
      {
        ...content,
        to: acuse.correo,
        tags: [{ name: 'kind', value: 'arco-acuse' }],
        idempotencyKey: `arco-acuse:${acuse.folio}`,
      },
      SCOPE,
    );
  } catch (error) {
    reportError(error, SCOPE);
  }
}
