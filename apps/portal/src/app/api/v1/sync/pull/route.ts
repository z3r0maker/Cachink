import { PullQuerySchema } from '@xangarro/contracts';

import { deviceRoute } from '@/server/api/device-route';
import { fail, ok } from '@/server/api/respond';
import { pull } from '@/server/sync/pull';

/** `GET /api/v1/sync/pull?since=<serverSeq>` (B-09; contract §5). */
export const GET = (request: Request): Promise<Response> =>
  deviceRoute(
    'sync/pull',
    request,
    async (caller) => {
      const since = new URL(request.url).searchParams.get('since') ?? undefined;
      const query = PullQuerySchema.safeParse({ since });
      if (!query.success) {
        return { response: fail('VALIDATION', 'since must be a non-negative integer', 400) };
      }
      return { response: ok(await pull(caller, query.data.since)) };
    },
    'No pudimos traer los cambios. Se reintentará.',
  );
