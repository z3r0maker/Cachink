/**
 * Typed errors for computing an entitlement (B-06).
 *
 * Both mean the billing record is wrong, not the phone: they are raised on the
 * server and logged, and the device is never handed a guessed plan.
 */

/** The subscription names a plan this build does not know. */
export class UnknownPlanError extends Error {
  readonly code = 'UNKNOWN_PLAN' as const;

  constructor(readonly planId: string) {
    super(`Plan desconocido: ${planId}`);
    this.name = 'UnknownPlanError';
  }
}

/** A paid status with no billing period cannot say how long it is valid. */
export class MissingPeriodEndError extends Error {
  readonly code = 'MISSING_PERIOD_END' as const;

  constructor(readonly status: string) {
    super(`La suscripción en estado ${status} no tiene fin de periodo.`);
    this.name = 'MissingPeriodEndError';
  }
}
