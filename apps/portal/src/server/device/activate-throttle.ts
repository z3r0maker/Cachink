import 'server-only';

import { throttleFail, throttleKey, throttleWait } from '@xangarro/data-pg';

import { db } from '../db';
import { ACTIVATE_PER_CODE, ACTIVATE_PER_IP, clientIp } from '../throttle-policy';

/**
 * `/activate` is the one door with no token in front of it: a correct guess
 * returns a device token and every operator's NIP hash. So wrong tries are
 * counted per IP and per code, and five in fifteen minutes locks either for
 * fifteen (B-17 amendment, audit SEC-DEV-01).
 *
 * Only **guessing** counts against the IP: an unknown code, a wrong email, an
 * expired code. `CODE_USED` is a real code redeemed twice — the phone's own
 * retry race does that — so it counts against that code alone.
 */
const GUESSES: ReadonlySet<string> = new Set(['CODE_INVALID', 'EMAIL_MISMATCH', 'CODE_EXPIRED']);

export function activateThrottle(request: Request, code: string | null) {
  const byIp = throttleKey('activate', 'ip', clientIp(request.headers));
  const byCode = code === null ? null : throttleKey('activate', 'code', code.toUpperCase());

  return {
    /** Seconds this caller must wait before trying at all; 0 = go. */
    async wait(): Promise<number> {
      const ip = await throttleWait(db(), byIp);
      return byCode === null ? ip : Math.max(ip, await throttleWait(db(), byCode));
    },
    /** Count a refusal; returns the lockout it triggered, or 0. */
    async failed(refusal: string): Promise<number> {
      const guess = GUESSES.has(refusal);
      if (!guess && refusal !== 'CODE_USED') return 0; // e.g. NO_DEVICE_SLOTS: the code was right
      const ip = guess ? await throttleFail(db(), byIp, ACTIVATE_PER_IP) : 0;
      const perCode = byCode === null ? 0 : await throttleFail(db(), byCode, ACTIVATE_PER_CODE);
      return Math.max(ip, perCode);
    },
  };
}
