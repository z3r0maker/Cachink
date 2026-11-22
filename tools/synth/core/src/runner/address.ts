/**
 * A run's client address (owner decision 3, «a fresh throttle IP»). The
 * portal's throttles key on the first `x-forwarded-for` hop
 * (`@xangarro/auth-core` `clientIp`), so runs that share an address spend
 * each other's signup and sign-in attempts. TEST-NET-3 (RFC 5737) never
 * routes anywhere, and its 254 hosts outnumber any corrida
 * (`max_runs_per_corrida` is at most 200).
 */
const HOSTS = 254;

export function runAddress(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= HOSTS) {
    throw new Error(`a corrida has ${HOSTS} client addresses; run index ${index} has none`);
  }
  return `203.0.113.${index + 1}`;
}
