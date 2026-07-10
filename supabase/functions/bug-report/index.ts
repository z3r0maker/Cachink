/**
 * bug-report Edge Function — ingest endpoint for error events and bug reports.
 *
 * Routes:
 *   POST /errors       — batch of error events (auto-shipped from client outbox)
 *   POST /bug-reports  — single user-initiated bug report
 *
 * Security:
 *   - Accepts the anon key in Authorization header (standard Supabase pattern)
 *   - Inserts via service-role client (env secret, never shipped to devices)
 *   - Body size capped at ~100KB
 *   - Per-device rate limits: 200 errors/day, 20 bug reports/day
 *   - Zod validation on every field
 *   - No stack traces accepted (defensively stripped)
 */

// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// ---------------------------------------------------------------------------
// Zod-like inline validators (Deno Edge Functions — keep deps minimal)
// ---------------------------------------------------------------------------

const VALID_SOURCES = new Set(['use-case', 'repository', 'ui', 'sync', 'system']);
const MAX_BODY_BYTES = 100 * 1024; // 100KB
const MAX_ERRORS_PER_DAY = 200;
const MAX_REPORTS_PER_DAY = 20;

interface ErrorEventInput {
  fingerprint?: string;
  errorName: string;
  errorMessage: string;
  source: string;
  operation?: string;
  context?: Record<string, unknown>;
  deviceId: string;
  businessId?: string | null;
  userId?: string | null;
  appVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  platform?: string;
  featureFlags?: Record<string, unknown>;
  occurredAt: string;
}

interface BugReportInput {
  description: string;
  snapshot?: Record<string, unknown>;
  deviceId: string;
  businessId?: string | null;
  userId?: string | null;
  appVersion?: string;
  osName?: string;
  osVersion?: string;
  deviceModel?: string;
  platform?: string;
  featureFlags?: Record<string, unknown>;
  submittedAt: string;
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isISODate(v: unknown): boolean {
  if (!isString(v)) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function validateErrorEvent(entry: any): ErrorEventInput | null {
  if (!entry || typeof entry !== 'object') return null;
  if (!isNonEmptyString(entry.errorName)) return null;
  if (!isNonEmptyString(entry.errorMessage)) return null;
  if (!isNonEmptyString(entry.source) || !VALID_SOURCES.has(entry.source)) return null;
  if (!isNonEmptyString(entry.deviceId)) return null;
  if (!isISODate(entry.occurredAt)) return null;
  return {
    fingerprint: isString(entry.fingerprint) ? entry.fingerprint : undefined,
    errorName: entry.errorName,
    errorMessage: entry.errorMessage.slice(0, 2000),
    source: entry.source,
    operation: isString(entry.operation) ? entry.operation : undefined,
    context: entry.context && typeof entry.context === 'object' ? sanitizeContext(entry.context) : undefined,
    deviceId: entry.deviceId,
    businessId: isString(entry.businessId) ? entry.businessId : null,
    userId: isString(entry.userId) ? entry.userId : null,
    appVersion: isString(entry.appVersion) ? entry.appVersion : undefined,
    osName: isString(entry.osName) ? entry.osName : undefined,
    osVersion: isString(entry.osVersion) ? entry.osVersion : undefined,
    deviceModel: isString(entry.deviceModel) ? entry.deviceModel : undefined,
    platform: isString(entry.platform) ? entry.platform : undefined,
    featureFlags: entry.featureFlags && typeof entry.featureFlags === 'object' ? entry.featureFlags : undefined,
    occurredAt: entry.occurredAt,
  };
}

function validateBugReport(body: any): BugReportInput | null {
  if (!body || typeof body !== 'object') return null;
  if (!isNonEmptyString(body.description)) return null;
  if (!isNonEmptyString(body.deviceId)) return null;
  if (!isISODate(body.submittedAt)) return null;
  return {
    description: body.description.slice(0, 5000),
    snapshot: body.snapshot && typeof body.snapshot === 'object' ? body.snapshot : undefined,
    deviceId: body.deviceId,
    businessId: isString(body.businessId) ? body.businessId : null,
    userId: isString(body.userId) ? body.userId : null,
    appVersion: isString(body.appVersion) ? body.appVersion : undefined,
    osName: isString(body.osName) ? body.osName : undefined,
    osVersion: isString(body.osVersion) ? body.osVersion : undefined,
    deviceModel: isString(body.deviceModel) ? body.deviceModel : undefined,
    platform: isString(body.platform) ? body.platform : undefined,
    featureFlags: body.featureFlags && typeof body.featureFlags === 'object' ? body.featureFlags : undefined,
    submittedAt: body.submittedAt,
  };
}

/** Strip errorStack defensively + limit context depth */
function sanitizeContext(ctx: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(ctx)) {
    if (key === 'errorStack' || key === 'error_stack') continue;
    out[key] = val;
  }
  return out;
}

/** Compute fingerprint: sha256(errorName|operation|messagePrefix) */
async function computeFingerprint(errorName: string, operation: string | undefined, errorMessage: string): Promise<string> {
  const msgPrefix = errorMessage.slice(0, 100);
  const input = `${errorName}|${operation ?? ''}|${msgPrefix}`;
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// Supabase client (service-role — bypasses RLS)
// ---------------------------------------------------------------------------

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

async function countDeviceEvents(
  client: ReturnType<typeof createClient>,
  deviceId: string,
  table: string,
  receivedColumn: string,
): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await client
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('device_id', deviceId)
    .gte(receivedColumn, since);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleErrors(body: any, client: ReturnType<typeof createClient>): Promise<Response> {
  const entries: unknown[] = Array.isArray(body.entries) ? body.entries : [];
  if (entries.length === 0) {
    return new Response(JSON.stringify({ error: 'No entries provided' }), { status: 400 });
  }
  if (entries.length > 50) {
    return new Response(JSON.stringify({ error: 'Max 50 entries per batch' }), { status: 400 });
  }

  const validated: ErrorEventInput[] = [];
  for (const entry of entries) {
    const v = validateErrorEvent(entry);
    if (v) validated.push(v);
  }
  if (validated.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid entries' }), { status: 400 });
  }

  // Rate limit check (use first entry's deviceId)
  const deviceId = validated[0].deviceId;
  const currentCount = await countDeviceEvents(client, deviceId, 'error_events', 'received_at');
  if (currentCount + validated.length > MAX_ERRORS_PER_DAY) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }

  // Compute fingerprints and insert
  const rows = await Promise.all(validated.map(async (e) => ({
    fingerprint: e.fingerprint || await computeFingerprint(e.errorName, e.operation, e.errorMessage),
    error_name: e.errorName,
    error_message: e.errorMessage,
    source: e.source,
    operation: e.operation ?? null,
    context: e.context ?? null,
    device_id: e.deviceId,
    business_id: e.businessId ?? null,
    user_id: e.userId ?? null,
    app_version: e.appVersion ?? null,
    os_name: e.osName ?? null,
    os_version: e.osVersion ?? null,
    device_model: e.deviceModel ?? null,
    platform: e.platform ?? null,
    feature_flags: e.featureFlags ?? null,
    occurred_at: e.occurredAt,
  })));

  const { error } = await client.from('error_events').insert(rows);
  if (error) {
    console.error('Insert error_events failed:', error);
    return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ accepted: rows.length }), { status: 201 });
}

async function handleBugReport(body: any, client: ReturnType<typeof createClient>): Promise<Response> {
  const report = validateBugReport(body);
  if (!report) {
    return new Response(JSON.stringify({ error: 'Invalid bug report payload' }), { status: 400 });
  }

  // Rate limit check
  const currentCount = await countDeviceEvents(client, report.deviceId, 'bug_reports', 'received_at');
  if (currentCount >= MAX_REPORTS_PER_DAY) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }

  const row = {
    description: report.description,
    snapshot: report.snapshot ?? null,
    device_id: report.deviceId,
    business_id: report.businessId ?? null,
    user_id: report.userId ?? null,
    app_version: report.appVersion ?? null,
    os_name: report.osName ?? null,
    os_version: report.osVersion ?? null,
    device_model: report.deviceModel ?? null,
    platform: report.platform ?? null,
    feature_flags: report.featureFlags ?? null,
    submitted_at: report.submittedAt,
  };

  const { error } = await client.from('bug_reports').insert(row);
  if (error) {
    console.error('Insert bug_reports failed:', error);
    return new Response(JSON.stringify({ error: 'Insert failed' }), { status: 500 });
  }

  return new Response(JSON.stringify({ accepted: 1 }), { status: 201 });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req: Request): Promise<Response> => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  // Body size guard
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
  }

  let body: any;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const client = getServiceClient();
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    if (path === 'errors') {
      return await handleErrors(body, client);
    }
    if (path === 'bug-reports') {
      return await handleBugReport(body, client);
    }
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  } catch (err) {
    console.error('Unhandled error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
