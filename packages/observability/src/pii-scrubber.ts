/**
 * PII scrubber for observability exports.
 *
 * Before any log data leaves the device (bug reports, remote shipping),
 * this module strips fields that may contain user-entered text.
 *
 * Mirrors the Sentry PII_FIELDS list from `@cachink/ui/telemetry` but
 * operates on our own log structures rather than Sentry event payloads.
 */

/** Fields that may contain user-entered text — never exported off device. */
const PII_FIELDS: ReadonlySet<string> = new Set([
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
]);

/**
 * Deep-clone and strip PII fields from a record.
 * Returns a new object (never mutates input).
 */
export function scrubRecord<T extends Record<string, unknown>>(input: T): T {
  const clone = { ...input };
  for (const key of Object.keys(clone)) {
    if (PII_FIELDS.has(key)) {
      (clone as Record<string, unknown>)[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object' && clone[key] !== null && !Array.isArray(clone[key])) {
      (clone as Record<string, unknown>)[key] = scrubRecord(
        clone[key] as Record<string, unknown>,
      );
    }
  }
  return clone;
}

/**
 * Scrub metadata/context from a log entry before export.
 */
export function scrubLogMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  return scrubRecord(metadata);
}
