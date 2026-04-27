/**
 * scrubPii — strip user-entered free-text fields from a Sentry event
 * before it ships (ADR-027, S4-C16).
 *
 * The scrubber is a **field-name blocklist**, not a content filter. Any
 * key matching `PII_FIELDS` is deleted from:
 *   - `event.extra`
 *   - `event.contexts.*`
 *   - each breadcrumb's `data`
 *   - each exception value's `mechanism.meta` (rare but happens)
 *
 * If the scrubber ever shortens by removing fields, the Sentry trace
 * loses context but never ships PII. That's the correct tradeoff.
 *
 * Adding any new user-entered free-text field to the codebase MUST add
 * it here (CLAUDE.md §12 review checklist).
 */

/** Fields that may contain user-entered text → never uploaded. */
export const PII_FIELDS: readonly string[] = [
  'concepto',
  'nombre',
  'telefono',
  'email',
  'nota',
  'descripcion',
  'explicacion',
  'proveedor',
  'clienteNombre',
  'empleadoNombre',
];

interface SentryEvent {
  extra?: Record<string, unknown>;
  contexts?: Record<string, Record<string, unknown> | undefined>;
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
  exception?: {
    values?: Array<{ mechanism?: { meta?: Record<string, unknown> } }>;
  };
}

function stripFields(obj: Record<string, unknown> | undefined): void {
  if (!obj) return;
  for (const field of PII_FIELDS) {
    if (field in obj) delete obj[field];
  }
}

export function scrubPii<E extends SentryEvent>(event: E): E {
  stripFields(event.extra);
  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      stripFields(event.contexts[key]);
    }
  }
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      stripFields(breadcrumb.data);
    }
  }
  if (event.exception?.values) {
    for (const value of event.exception.values) {
      stripFields(value.mechanism?.meta);
    }
  }
  return event;
}
