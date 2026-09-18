import 'server-only';

import { authenticateDevice, type DeviceCaller } from '../device/authenticate';
import { logApi, reportError, type ApiLine } from '../observability/report';
import { deviceFailure } from './device-failure';
import { fail, protocolRefusal } from './respond';

/**
 * Every authenticated phone endpoint, the same way: protocol check, device
 * authentication (with its 401/429), the handler, and — whatever happened —
 * exactly one structured log line with ids, status and timing (B-18).
 *
 * A handler returns its response plus any counts worth logging; an unexpected
 * throw is reported with the caller's tags and answered as INTERNAL.
 */
export interface Handled {
  readonly response: Response;
  readonly log?: Pick<ApiLine, 'accepted' | 'rejected' | 'codes'>;
}

export async function deviceRoute(
  endpoint: string,
  request: Request,
  handle: (caller: DeviceCaller) => Promise<Handled>,
  internalMessage: string,
): Promise<Response> {
  const started = performance.now();
  let caller: DeviceCaller | undefined;
  let handled: Handled;
  try {
    const refusal = protocolRefusal(request);
    if (refusal !== null) handled = { response: refusal };
    else {
      caller = await authenticateDevice(request);
      handled = await handle(caller);
    }
  } catch (error) {
    const refused = deviceFailure(error);
    if (refused === null) {
      reportError(error, { endpoint, businessId: caller?.businessId, deviceId: caller?.deviceId });
    }
    handled = { response: refused ?? fail('INTERNAL', internalMessage) };
  }
  logApi({
    endpoint,
    status: handled.response.status,
    ms: Math.round(performance.now() - started),
    businessId: caller?.businessId,
    deviceId: caller?.deviceId,
    ...handled.log,
  });
  return handled.response;
}
