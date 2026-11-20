import type { Persona } from '../schemas/persona';

/**
 * A persona's network, as Chromium's `Network.emulateNetworkConditions` takes
 * it. Throughput is bytes per second, latency milliseconds. The numbers are
 * DevTools' own presets, so a run reads like a manual check on the same
 * profile.
 */
export interface NetworkConditions {
  readonly offline: boolean;
  readonly latency: number;
  readonly downloadThroughput: number;
  readonly uploadThroughput: number;
}

const kbps = (n: number) => (n * 1024) / 8;

const FOUR_G: NetworkConditions = {
  offline: false,
  latency: 60,
  downloadThroughput: kbps(9_000),
  uploadThroughput: kbps(9_000),
};
const SLOW_3G: NetworkConditions = {
  offline: false,
  latency: 400,
  downloadThroughput: kbps(400),
  uploadThroughput: kbps(400),
};

/** `null` means unthrottled. «offline-intermitente» runs on 4g; its cuts are an interruption (S-12). */
export function networkConditions(network: Persona['device']['network']): NetworkConditions | null {
  if (network === 'wifi') return null;
  if (network === 'slow-3g') return SLOW_3G;
  return FOUR_G;
}
