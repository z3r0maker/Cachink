import { ok } from '@/server/api/respond';
import { deviceRoute } from '@/server/api/device-route';
import { entitlementFor } from '@/server/device/bootstrap';
import { usageFor } from '@/server/usage/live';
import { signEntitlement } from '@/server/device/credentials';
import { withTenant } from '@/server/db';

/**
 * `GET /api/v1/entitlement` — the cheap refresh (contract §7).
 *
 * The same signed object `/activate` and `/sync/pull` carry, on its own: the
 * phone asks after an upsell, without pulling. Computed per request, never
 * stored — an entitlement is a statement about *now*.
 */
export const GET = (request: Request): Promise<Response> =>
  deviceRoute(
    'entitlement',
    request,
    async ({ businessId }) => {
      const entitlement = await withTenant(businessId, (tx) =>
        entitlementFor(tx, businessId, new Date()),
      );
      const usage = await usageFor(businessId).catch(() => null);
      return {
        response: ok({
          entitlement: await signEntitlement(entitlement),
          ...(usage === null ? {} : { usage }),
        }),
      };
    },
    'No pudimos revisar tu plan. Intenta de nuevo.',
  );
