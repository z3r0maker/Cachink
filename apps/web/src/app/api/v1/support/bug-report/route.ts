import { MAX_BUG_REPORT_BYTES } from '@xangarro/contracts';
import { throttleKey, throttleTake } from '@xangarro/data-pg';

import { deviceRoute, type Handled } from '@/server/api/device-route';
import { fail, ok, rateLimited } from '@/server/api/respond';
import { db } from '@/server/db';
import { fileBugReport } from '@/server/support/bug-report';
import { supportInboxFromEnv } from '@/server/support-inbox';

/**
 * `POST /api/v1/support/bug-report` — the phone's «Reportar un problema»
 * (contract §9, N-81, ADR-141).
 *
 * Device-token authed like every `/api/v1` route, so the report is filed
 * under the device and business the **token** names; the body has no say in
 * who is calling. The rules are `server/support/bug-report.ts`'s: this file
 * only wires the throttle and the staff inbox and turns an outcome into the
 * contract's answer.
 */
const tooLarge = (request: Request): boolean =>
  Number(request.headers.get('content-length') ?? 0) > MAX_BUG_REPORT_BYTES;

const refused = (reason: string): Handled => ({
  response: fail('VALIDATION', reason, 400),
  log: { rejected: 1, codes: { VALIDATION: 1 } },
});

export const POST = (request: Request): Promise<Response> =>
  deviceRoute(
    'support/bug-report',
    request,
    async (caller) => {
      if (tooLarge(request)) return refused('the report is too large');
      const outcome = await fileBugReport(caller, await request.text(), {
        inbox: supportInboxFromEnv(),
        key: throttleKey,
        take: (key, max, windowSeconds) => throttleTake(db(), key, max, windowSeconds),
      });
      if (outcome.kind === 'invalid') return refused(outcome.reason);
      if (outcome.kind === 'limited') {
        return {
          response: rateLimited(outcome.retryAfter),
          log: { rejected: 1, codes: { RATE_LIMITED: 1 } },
        };
      }
      return { response: ok({ accepted: true }), log: { accepted: 1 } };
    },
    'No pudimos enviar tu reporte. Intenta de nuevo.',
  );
