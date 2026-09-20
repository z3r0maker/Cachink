/**
 * The linked register's device credentials (ADR-071 §1): the token
 * `/activate` returned, its device id and the entitlement's expiry, kept in
 * localStorage — one register per browser profile, exactly one token at a
 * time. O-12's linking screen writes them; the outbox flusher reads the token
 * for every push. Clearing them (or the site data) returns the register to
 * the linking screen with its database intact until a reset.
 */

export interface DeviceCredentials {
  readonly deviceToken: string;
  readonly deviceId: string;
  readonly businessId: string;
  readonly activatedAt: string;
}

const KEY = 'xangarro.device';

export function readDevice(): DeviceCredentials | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as DeviceCredentials).deviceToken !== 'string' ||
      typeof (parsed as DeviceCredentials).deviceId !== 'string' ||
      typeof (parsed as DeviceCredentials).businessId !== 'string'
    ) {
      return null;
    }
    return parsed as DeviceCredentials;
  } catch {
    return null;
  }
}

export function writeDevice(credentials: DeviceCredentials): void {
  localStorage.setItem(KEY, JSON.stringify(credentials));
}

export function clearDevice(): void {
  localStorage.removeItem(KEY);
}
