import 'server-only';

import { randomInt } from 'node:crypto';
import { ACTIVATION_CODE_REGEX } from '@xangarro/contracts';

/**
 * Activation codes — the credential a phone redeems to join a business.
 *
 * A code is a **bearer credential**: whoever types it binds a device to this
 * tenant (contract §3, ADR-053 Q5). So:
 *
 *  - It comes from `crypto.randomInt`, never `Math.random`, and `randomInt`
 *    draws uniformly so no character is likelier than another.
 *  - The alphabet is **derived from the contract's own regex**, not retyped.
 *    Retyping it is how the seed ended up with ULIDs containing I, O and U, and
 *    a portal sentinel containing an L: three times, in one day. Deriving it
 *    means the portal cannot mint a code `/activate` would reject.
 */
export const CODE_LENGTH = 8;
export const CODE_TTL_MS = 48 * 60 * 60 * 1000;

/** Every character the contract accepts, in a stable order. */
export const ALPHABET: readonly string[] = (() => {
  const accepted: string[] = [];
  for (let c = 0x21; c < 0x7f; c += 1) {
    const ch = String.fromCharCode(c);
    if (ACTIVATION_CODE_REGEX.test(ch.repeat(CODE_LENGTH))) accepted.push(ch);
  }
  return accepted;
})();

export function mintActivationCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  // Belt and braces: if the derivation above were ever wrong, fail loudly here
  // rather than hand a shopkeeper a code the phone will refuse.
  if (!ACTIVATION_CODE_REGEX.test(code)) {
    throw new Error(`Minted an activation code the contract rejects: ${code}`);
  }
  return code;
}
