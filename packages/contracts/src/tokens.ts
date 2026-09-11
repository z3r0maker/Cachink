/**
 * Token claim shapes (docs/plan/02-contracts.md §2). Signing/verification is
 * the backend's job; the phone only ever holds the opaque string.
 */

import { z } from 'zod';

export const DeviceTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  role: z.literal('authenticated'),
  aud: z.literal('authenticated'),
  business_id: z.string().min(1),
  device_id: z.string().min(1),
  kind: z.literal('device'),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});
export type DeviceTokenClaims = z.infer<typeof DeviceTokenClaimsSchema>;

/** Device tokens live one year; revocation is server-side on the devices row. */
export const DEVICE_TOKEN_TTL_SECONDS = 365 * 24 * 60 * 60;

export const MembershipSchema = z.object({
  business_id: z.string().min(1),
  role: z.enum(['owner', 'admin', 'viewer']),
});
export type Membership = z.infer<typeof MembershipSchema>;
