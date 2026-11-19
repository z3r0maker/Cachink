import type { APIRequestContext } from '@playwright/test';
import { mintCodeFor, type Tenant } from '@xangarro/testing/tenant';

import { redeemCode, type Phone } from './sync-phone';

/**
 * A phone on a tenant of its own (ADR-128), for the sync specs that write. The
 * code minting lives in `@xangarro/testing/tenant` since S-02 (ADR-153 §4) and
 * is re-exported here; the redeem through the real `/activate` stays, because
 * it is typed on Playwright's request context. `sync-phone.ts`'s `ticket`,
 * `sale` and `client` take the phone and write rows for its business.
 */
export { codeOf, freeSlots, mintCodeFor } from '@xangarro/testing/tenant';

/** A phone joined to `t` through the real `/activate`. */
export async function activateOn(request: APIRequestContext, t: Tenant): Promise<Phone> {
  return redeemCode(request, t.email, await mintCodeFor(t));
}
