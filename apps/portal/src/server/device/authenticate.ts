import 'server-only';

import { devices } from '@xangarro/data-pg';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

import { withTenant } from '../db';
import { deviceTokenSecret } from './credentials';

/**
 * Who is calling: the device behind a `Bearer` device token (contract §2).
 *
 * The token proves which device and business — it is signed, so neither can
 * be forged. It does **not** prove the device is still allowed: revocation is
 * the `devices` row (B-12), which is why the token may live a year. So every
 * call reads that row, inside the tenant the token names.
 */
export interface DeviceCaller {
  readonly businessId: string;
  readonly deviceId: string;
}

export class DeviceAuthError extends Error {
  constructor(readonly code: 'UNAUTHENTICATED' | 'DEVICE_REVOKED') {
    super(code);
    this.name = 'DeviceAuthError';
  }
}

async function claims(request: Request): Promise<DeviceCaller> {
  const token = /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1];
  if (token === undefined) throw new DeviceAuthError('UNAUTHENTICATED');
  const { payload } = await jwtVerify(token, deviceTokenSecret(), {
    algorithms: ['HS256'],
    audience: 'authenticated',
  }).catch(() => {
    throw new DeviceAuthError('UNAUTHENTICATED');
  });
  const { business_id: businessId, device_id: deviceId, kind, sub } = payload;
  if (kind !== 'device' || typeof businessId !== 'string' || typeof deviceId !== 'string') {
    throw new DeviceAuthError('UNAUTHENTICATED');
  }
  if (sub !== deviceId) throw new DeviceAuthError('UNAUTHENTICATED');
  return { businessId, deviceId };
}

export async function authenticateDevice(request: Request): Promise<DeviceCaller> {
  const caller = await claims(request);
  const [row] = await withTenant(caller.businessId, (tx) =>
    tx
      .select({ revokedAt: devices.revokedAt })
      .from(devices)
      .where(eq(devices.id, caller.deviceId)),
  );
  // A signed token for a row that is gone is a token we no longer honour.
  if (row === undefined) throw new DeviceAuthError('UNAUTHENTICATED');
  if (row.revokedAt !== null) throw new DeviceAuthError('DEVICE_REVOKED');
  return caller;
}
