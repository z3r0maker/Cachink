import { ApplyPushUseCase } from '@xangarro/application';
import { PushRequestSchema, PushResponseSchema } from '@xangarro/contracts';

import { fail, ok, protocolRefusal } from '@/server/api/respond';
import { withTenant } from '@/server/db';
import { authenticateDevice, DeviceAuthError } from '@/server/device/authenticate';
import { PgPushStore } from '@/server/sync/pg-push-store';

/**
 * `POST /api/v1/sync/push` (B-08; contract §4). HTTP only: authenticate, parse,
 * run `ApplyPushUseCase` in one tenant transaction, answer per row.
 */
export async function POST(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  try {
    const { businessId, deviceId } = await authenticateDevice(request);
    const parsed = PushRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return fail('VALIDATION', message.join('; '), 400);
    }
    const result = await withTenant(businessId, (tx) =>
      new ApplyPushUseCase(new PgPushStore(tx, businessId, deviceId), businessId, (e) =>
        console.error('[sync/push] row', e),
      ).execute(parsed.data),
    );
    return ok(PushResponseSchema.parse({ ...result, serverTime: new Date().toISOString() }));
  } catch (error) {
    if (error instanceof DeviceAuthError) return fail(error.code, error.code);
    console.error('[sync/push]', error);
    return fail('INTERNAL', 'No pudimos recibir los cambios. Se reintentará.');
  }
}
