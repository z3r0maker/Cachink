/**
 * Validation for the bug-report ingest (F-10). The input is untrusted — it
 * arrives from any phone holding the anon key — so every field is checked and
 * anything unexpected becomes `null`/`undefined`, never passed through.
 *
 * No Zod: this runs on Deno with URL imports and the dependency list is kept
 * to the Supabase client. The checks are the same ones the old inline code
 * made, reorganised so no function carries them all.
 */
export type Json = Record<string, unknown>;

export const VALID_SOURCES: ReadonlySet<string> = new Set([
  'use-case',
  'repository',
  'ui',
  'sync',
  'system',
]);

const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isIsoDate = (v: unknown): v is string =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isSource = (v: unknown): v is string => typeof v === 'string' && VALID_SOURCES.has(v);

/** Who sent it and from what — shared by both kinds of report. */
export interface DeviceFields {
  readonly deviceId: string;
  readonly businessId: string | null;
  readonly userId: string | null;
  readonly appVersion: string | undefined;
  readonly osName: string | undefined;
  readonly osVersion: string | undefined;
  readonly deviceModel: string | undefined;
  readonly platform: string | undefined;
  readonly featureFlags: Json | undefined;
}

function deviceFields(src: Json): DeviceFields | null {
  if (!nonEmpty(src['deviceId'])) return null;
  return {
    deviceId: src['deviceId'],
    businessId: str(src['businessId']) ?? null,
    userId: str(src['userId']) ?? null,
    appVersion: str(src['appVersion']),
    osName: str(src['osName']),
    osVersion: str(src['osVersion']),
    deviceModel: str(src['deviceModel']),
    platform: str(src['platform']),
    featureFlags: isObject(src['featureFlags']) ? src['featureFlags'] : undefined,
  };
}

/** Stacks are never stored: they carry file paths and, sometimes, data. */
export function sanitizeContext(ctx: Json): Json {
  return Object.fromEntries(
    Object.entries(ctx).filter(([key]) => key !== 'errorStack' && key !== 'error_stack'),
  );
}

export interface ErrorEventInput extends DeviceFields {
  readonly fingerprint: string | undefined;
  readonly errorName: string;
  readonly errorMessage: string;
  readonly source: string;
  readonly operation: string | undefined;
  readonly context: Json | undefined;
  readonly occurredAt: string;
}

export function validateErrorEvent(entry: unknown): ErrorEventInput | null {
  if (!isObject(entry)) return null;
  const device = deviceFields(entry);
  const { errorName, errorMessage, source, occurredAt } = entry;
  if (device === null || !nonEmpty(errorName) || !nonEmpty(errorMessage)) return null;
  if (!isSource(source) || !isIsoDate(occurredAt)) return null;
  return {
    ...device,
    fingerprint: str(entry['fingerprint']),
    errorName,
    errorMessage: errorMessage.slice(0, 2000),
    source,
    operation: str(entry['operation']),
    context: isObject(entry['context']) ? sanitizeContext(entry['context']) : undefined,
    occurredAt,
  };
}

export interface BugReportInput extends DeviceFields {
  readonly description: string;
  readonly snapshot: Json | undefined;
  readonly submittedAt: string;
}

export function validateBugReport(body: unknown): BugReportInput | null {
  if (!isObject(body)) return null;
  const device = deviceFields(body);
  const { description, submittedAt } = body;
  if (device === null || !nonEmpty(description) || !isIsoDate(submittedAt)) return null;
  return {
    ...device,
    description: description.slice(0, 5000),
    snapshot: isObject(body['snapshot']) ? body['snapshot'] : undefined,
    submittedAt,
  };
}
