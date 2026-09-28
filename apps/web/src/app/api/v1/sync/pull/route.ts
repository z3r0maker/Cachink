import { PullQuerySchema } from '@xangarro/contracts';

import { deviceRoute } from '@/server/api/device-route';
import { fail, ok } from '@/server/api/respond';
import { pull } from '@/server/sync/pull';

/** `GET /api/v1/sync/pull?since=<serverSeq>[&snapshot=<start|token>]` (B-09, C-23; contract §5). */
export const GET = (request: Request): Promise<Response> =>
  deviceRoute(
    'sync/pull',
    request,
    async (caller) => {
      const params = new URL(request.url).searchParams;
      const query = PullQuerySchema.safeParse({
        since: params.get('since') ?? undefined,
        snapshot: params.get('snapshot') ?? undefined,
      });
      if (!query.success) {
        return { response: fail('VALIDATION', 'since must be a non-negative integer', 400) };
      }
      const result = await pull(caller, query.data);
      if ('refused' in result) {
        return { response: fail(result.refused.code, result.message, result.refused.status) };
      }
      return { response: ok(result) };
    },
    'No pudimos traer los cambios. Se reintentará.',
  );
