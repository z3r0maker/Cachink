/**
 * Token claim shapes (docs/plan/02-contracts.md §2). Signing/verification is
 * the backend's job; the phone only ever holds the opaque string.
 */

import { z } from 'zod';

/**
 * Xangarro's own issuer and audience for device tokens (ADR-138, audit
 * SEC-DATA-01): never Supabase's `authenticated`, so a device token can never
 * double as a Supabase REST credential.
 */
export const DEVICE_TOKEN_ISSUER = 'https://app.xangarro.mx' as const;
export const DEVICE_TOKEN_AUDIENCE = 'xangarro:device' as const;

export const DeviceTokenClaimsSchema = z.object({
  sub: z.string().min(1),
  iss: z.literal(DEVICE_TOKEN_ISSUER),
  aud: z.literal(DEVICE_TOKEN_AUDIENCE),
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
