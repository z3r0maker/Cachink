import { ApplyPushUseCase } from '@xangarro/application';
import { PushRequestSchema, PushResponseSchema } from '@xangarro/contracts';
import { after } from 'next/server';

import { deviceRoute } from '@/server/api/device-route';
import { fail, ok } from '@/server/api/respond';
import { withTenant } from '@/server/db';
import { reportError } from '@/server/observability/report';
import { PgPushStore } from '@/server/sync/pg-push-store';
import { refreshUsageAfterPush } from '@/server/usage/live';

/**
 * `POST /api/v1/sync/push` (B-08; contract §4). HTTP only: parse, run
 * `ApplyPushUseCase` in one tenant transaction, answer per row, and log the
 * batch as one line of counts — never the rows. When rows were accepted, the
 * business's open-month usage is recounted after the response (N-02).
 */
const countCodes = (codes: readonly string[]) =>
  codes.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c]: (acc[c] ?? 0) + 1 }), {});

export const POST = (request: Request): Promise<Response> =>
  deviceRoute(
    'sync/push',
    request,
    async ({ businessId, deviceId }) => {
      const parsed = PushRequestSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        return { response: fail('VALIDATION', message.join('; '), 400) };
      }
      const scope = { endpoint: 'sync/push:row', businessId, deviceId };
      const result = await withTenant(businessId, (tx) =>
        new ApplyPushUseCase(new PgPushStore(tx, businessId, deviceId), businessId, (e) =>
          reportError(e, scope),
        ).execute(parsed.data),
      );
      if (result.accepted.length > 0) after(() => refreshUsageAfterPush(businessId));
      return {
        response: ok(PushResponseSchema.parse({ ...result, serverTime: new Date().toISOString() })),
        log: {
          accepted: result.accepted.length,
          rejected: result.rejected.length,
          codes: countCodes(result.rejected.map((r) => r.code)),
        },
      };
    },
    'No pudimos recibir los cambios. Se reintentará.',
  );
