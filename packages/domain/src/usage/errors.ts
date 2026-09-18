/**
 * Typed errors for usage metering. They signal caller bugs (bad input), never
 * "over the limit": being over a limit is a value, not an error (ADR-065).
 */

/** A timestamp that does not parse to a real instant. */
export class InvalidUsageDateError extends Error {
  readonly code = 'INVALID_USAGE_DATE' as const;

  constructor(readonly value: string) {
    super(`Fecha inválida para medir uso: ${value}`);
    this.name = 'InvalidUsageDateError';
  }
}

/** An IANA time zone the runtime does not know. */
export class InvalidUsageTimeZoneError extends Error {
  readonly code = 'INVALID_USAGE_TIME_ZONE' as const;

  constructor(readonly timeZone: string) {
    super(`Zona horaria desconocida: ${timeZone}`);
    this.name = 'InvalidUsageTimeZoneError';
  }
}

/** A period that is not `'YYYY-MM'`. */
export class InvalidUsagePeriodError extends Error {
  readonly code = 'INVALID_USAGE_PERIOD' as const;

  constructor(readonly period: string) {
    super(`Periodo inválido (se espera AAAA-MM): ${period}`);
    this.name = 'InvalidUsagePeriodError';
  }
}

/** A limit that is neither `null` nor a positive integer. */
export class InvalidUsageLimitsError extends Error {
  readonly code = 'INVALID_USAGE_LIMITS' as const;

  constructor(
    readonly metric: string,
    readonly value: number,
  ) {
    super(`Límite inválido para ${metric}: ${value}`);
    this.name = 'InvalidUsageLimitsError';
  }
}

/** A count that is not a non-negative integer (or a non-positive increment). */
export class InvalidUsageCountError extends Error {
  readonly code = 'INVALID_USAGE_COUNT' as const;

  constructor(
    readonly field: string,
    readonly value: number,
  ) {
    super(`Conteo inválido para ${field}: ${value}`);
    this.name = 'InvalidUsageCountError';
  }
}

/** Two snapshots compared across different businesses. */
export class UsageSnapshotMismatchError extends Error {
  readonly code = 'USAGE_SNAPSHOT_MISMATCH' as const;

  constructor(
    readonly previous: string,
    readonly next: string,
  ) {
    super(`Los conteos pertenecen a negocios distintos: ${previous} ≠ ${next}`);
    this.name = 'UsageSnapshotMismatchError';
  }
}
