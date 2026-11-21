import 'server-only';

import { protocolRefusal, rateLimited } from '../api/respond';
import { activateThrottle, credentialOf } from './activate-throttle';

/**
 * The front of the two doors with no token in front of them, `/activate` and
 * `/activate/preview` (N-25): the protocol header, the raw body, and the
 * throttle's wait, in that order and in one place. Either the answer to send
 * now, or the body and the throttle to count this try's refusal on.
 */
export type Door =
  | { readonly open: false; readonly response: Response }
  | {
      readonly open: true;
      readonly body: unknown;
      readonly throttle: ReturnType<typeof activateThrottle>;
    };

export async function activateDoor(request: Request): Promise<Door> {
  const refusal = protocolRefusal(request);
  if (refusal !== null) return { open: false, response: refusal };
  const body: unknown = await request.json().catch(() => null);
  const throttle = activateThrottle(request, credentialOf(body));
  const wait = await throttle.wait();
  if (wait > 0) return { open: false, response: rateLimited(wait) };
  return { open: true, body, throttle };
}
