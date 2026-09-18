import { fail, ok, protocolRefusal } from '@/server/api/respond';
import { authenticateDevice, DeviceAuthError } from '@/server/device/authenticate';
import { entitlementFor } from '@/server/device/bootstrap';
import { signEntitlement } from '@/server/device/credentials';

/**
 * `GET /api/v1/entitlement` — the cheap refresh (contract §7).
 *
 * The same signed object `/activate` and `/sync/pull` carry, on its own: the
 * phone asks after an upsell, without pulling. Computed per request, never
 * stored — an entitlement is a statement about *now*.
 */
export async function GET(request: Request): Promise<Response> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return refusal;

  try {
    const { businessId } = await authenticateDevice(request);
    return ok({ entitlement: await signEntitlement(entitlementFor(businessId, new Date())) });
  } catch (error) {
    if (error instanceof DeviceAuthError) return fail(error.code, error.code);
    console.error('[entitlement]', error);
    return fail('INTERNAL', 'No pudimos revisar tu plan. Intenta de nuevo.');
  }
}
