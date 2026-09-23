/**
 * Which activation code a mock `/activate` request redeems (§3, C-14), or the
 * public refusal. A wrong email is `CODE_INVALID`, never its own answer
 * (SEC-DEV-01); the scan path checks its own 15-minute clock before the code's.
 */
import { isScanRequest, type ActivateErrorCode, type ActivateRequest } from '../activate.js';
import type { ActivationCode, MockState } from './state.js';

export type Claim = { readonly code: ActivationCode } | { readonly refusal: ActivateErrorCode };

function byCode(state: MockState, value: string, email: string): Claim {
  const code = state.codes.get(value);
  return code && code.email === email ? { code } : { refusal: 'CODE_INVALID' };
}

function byToken(state: MockState, token: string): Claim {
  const pairing = state.pairingTokens.get(token);
  const code = pairing ? state.codes.get(pairing.code) : undefined;
  if (!pairing || !code) return { refusal: 'CODE_INVALID' };
  if (!code.redeemedBy && pairing.expiresAt < Date.now()) return { refusal: 'CODE_EXPIRED' };
  return { code };
}

export function claimable(state: MockState, req: ActivateRequest): Claim {
  const found = isScanRequest(req)
    ? byToken(state, req.qrToken)
    : byCode(state, req.code, req.email);
  if ('refusal' in found) return found;
  if (found.code.expiresAt < Date.now()) return { refusal: 'CODE_EXPIRED' };
  if (found.code.redeemedBy) return { refusal: 'CODE_USED' };
  return found;
}
