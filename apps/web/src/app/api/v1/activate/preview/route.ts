import { ActivatePreviewRequestSchema } from '@xangarro/contracts';

import { fail, ok, rateLimited } from '@/server/api/respond';
import { activateDoor } from '@/server/device/activate-door';
import { previewPairing } from '@/server/device/preview';
import { logApi, reportError } from '@/server/observability/report';

/**
 * `POST /api/v1/activate/preview` — «¿Es tu negocio?» before a scanned phone
 * links (N-25, SEC-MOB-04).
 *
 * The same door as `/activate` (`activate-door.ts`): the protocol header,
 * then the throttle, on the same per-IP and per-token keys, so previewing
 * spends the redeem's budget instead of adding one. An unknown or expired
 * token counts as a guess, a used one against that token alone, exactly as
 * on redeem. A good token counts nothing and stays good: this route reads
 * and never writes.
 */
async function handle(request: Request): Promise<Response> {
  const door = await activateDoor(request);
  if (!door.open) return door.response;
  const parsed = ActivatePreviewRequestSchema.safeParse(door.body);
  if (!parsed.success) {
    await door.throttle.failed('CODE_INVALID');
    return fail('CODE_INVALID', 'pairing token');
  }
  try {
    const found = await previewPairing(parsed.data.qrToken);
    if (found.ok) return ok(found.preview);
    const locked = await door.throttle.failed(found.refusal);
    return locked > 0 ? rateLimited(locked) : fail(found.refusal, found.refusal);
  } catch (error) {
    reportError(error, { endpoint: 'activate/preview' });
    return fail('INTERNAL', 'No pudimos revisar el código. Intenta de nuevo.');
  }
}

/** One log line per try: status and timing, never the token or what it named (B-18). */
export async function POST(request: Request): Promise<Response> {
  const started = performance.now();
  const response = await handle(request);
  logApi({
    endpoint: 'activate/preview',
    status: response.status,
    ms: Math.round(performance.now() - started),
  });
  return response;
}
