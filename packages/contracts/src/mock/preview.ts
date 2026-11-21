/**
 * The mock's `POST /activate/preview` (N-25): the fixture business's name and
 * its owner, for a token that would redeem right now; the scan path's own
 * refusal otherwise. It reads the state and writes nothing, so the token
 * still redeems afterwards.
 */
import {
  ActivatePreviewRequestSchema,
  ActivatePreviewResponseSchema,
} from '../activate-preview.js';
import { ERROR_CATALOG } from '../errors.js';
import { claimableToken } from './claim.js';
import { FIXTURE_BUSINESS_NOMBRE, FIXTURE_OWNER_NOMBRE } from './fixtures.js';
import type { MockResponse } from './handler.js';
import type { MockState } from './state.js';

export function previewPairing(state: MockState, body: unknown): MockResponse {
  const parsed = ActivatePreviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: { code: 'CODE_INVALID', message: 'pairing token' } } };
  }
  const found = claimableToken(state, parsed.data.qrToken);
  if ('refusal' in found) {
    const code = found.refusal;
    return { status: ERROR_CATALOG[code].httpStatus, body: { error: { code, message: code } } };
  }
  return {
    status: 200,
    body: ActivatePreviewResponseSchema.parse({
      businessName: FIXTURE_BUSINESS_NOMBRE,
      ownerFirstName: FIXTURE_OWNER_NOMBRE,
      ownerEmail: found.code.email,
    }),
  };
}
