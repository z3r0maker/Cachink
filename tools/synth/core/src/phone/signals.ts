import type { Persona } from '../schemas/persona';

/**
 * The phone run's signals, read from text (S-06): the emulator console's
 * network settings for a persona, the devices adb lists, logcat lines, and the
 * portal's own per-call API log (`logApi`, one JSON line per phone request),
 * which is the phone's `network.jsonl`.
 */
export interface EmulatorNetwork {
  /** `adb emu network speed`: full, lte, umts, edge, gsm… */
  readonly speed: string;
  /** `adb emu network delay`: none, umts, edge, gprs… */
  readonly delay: string;
}

/** «offline-intermitente» runs on 4g; its cuts are an interruption (S-12). */
export function emulatorNetwork(network: Persona['device']['network']): EmulatorNetwork {
  if (network === 'wifi') return { speed: 'full', delay: 'none' };
  if (network === 'slow-3g') return { speed: 'umts', delay: 'umts' };
  return { speed: 'lte', delay: 'none' };
}

/** The serials `adb devices` lists as up (`device`), in order. */
export function parseAdbDevices(out: string): string[] {
  return out
    .split('\n')
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter(([serial, state]) => serial !== undefined && serial !== '' && state === 'device')
    .map(([serial]) => serial as string);
}

export interface LogcatLine {
  readonly epochMs: number;
  readonly level: string;
  readonly tag: string;
  readonly text: string;
}

const LOGCAT = /^\s*(\d+)\.(\d{3})\s+\d+\s+\d+\s+([VDIWEF])\s+([^:]+?)\s*:\s?(.*)$/;

/**
 * A `logcat -v epoch` line worth the judge's time: any error or fatal, and
 * React Native's own warnings. Everything else, including platform chatter, is
 * dropped.
 */
export function parseLogcat(line: string): LogcatLine | undefined {
  const m = LOGCAT.exec(line);
  if (m === null) return undefined;
  const [, secs, millis, level, tag, text] = m as unknown as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const keep = level === 'E' || level === 'F' || (level === 'W' && tag === 'ReactNativeJS');
  if (!keep) return undefined;
  return { epochMs: Number(secs) * 1000 + Number(millis), level, tag, text };
}

export const SLOW_API_MS = 1_500;

/**
 * A portal API line that says something went wrong for this tenant: a 4xx or
 * 5xx, rows the server refused, or a slow call. Activation has no business yet,
 * so its refusals are kept whoever they were for.
 */
export function apiProblem(line: string, biz: string): Record<string, unknown> | undefined {
  if (!line.startsWith('{')) return undefined;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(line) as Record<string, unknown>;
  } catch {
    return undefined;
  }
  if (o.evt !== 'api') return undefined;
  if (o.business_id !== undefined && o.business_id !== biz) return undefined;
  const failed = Number(o.status) >= 400;
  const refused = Number(o.rejected ?? 0) > 0;
  const slow = Number(o.ms) > SLOW_API_MS;
  if (!failed && !refused && !slow) return undefined;
  const { evt: _evt, business_id: _biz, device_id: _dev, ...rest } = o;
  return rest;
}
