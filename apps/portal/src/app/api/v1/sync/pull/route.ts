import { PullQuerySchema } from '@xangarro/contracts';

import { fail, ok, protocolRefusal } from '@/server/api/respond';
import { authenticateDevice, DeviceAuthError } from '@/server/device/authenticate';
import { pull } from '@/server/sync/pull';

/** `GET /api/v1/sync/pull?since=<serverSeq>` (B-09; contract §5). */
export async function GET(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  try {
    const caller = await authenticateDevice(request);
    const since = new URL(request.url).searchParams.get('since') ?? undefined;
    const query = PullQuerySchema.safeParse({ since });
    if (!query.success) {
      return fail('VALIDATION', 'since must be a non-negative integer', 400);
    }
    return ok(await pull(caller, query.data.since));
  } catch (error) {
    if (error instanceof DeviceAuthError) return fail(error.code, error.code);
    console.error('[sync/pull]', error);
    return fail('INTERNAL', 'No pudimos traer los cambios. Se reintentará.');
  }
}
