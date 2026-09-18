import type { Capabilities, Role, ScreenState, Session } from './types';

/**
 * Role gating **hides** rather than disables.
 *
 * "`viewer` sees no create/edit/delete affordances anywhere. […] Gating hides
 * the control rather than disabling it, except where a disabled state carries
 * meaning (the current plan's CTA on Suscripción)." — design handoff, "Roles".
 *
 * The server rejects regardless; this is presentation, not security.
 */
export function canWrite(role: Role): boolean {
  return role !== 'viewer';
}

/** Suscripción and Negocio restrict further: only the billing contact edits. */
export function isOwner(role: Role): boolean {
  return role === 'owner';
}

/**
 * Read-only actions — Exportar, Informe PDF, Compartir comprobante — stay
 * available to everyone, which is why Estados financieros has no role gating
 * at all. Plan gating is a separate question, handled below.
 */
export function canExport(): boolean {
  return true;
}

/**
 * Resolve what a screen should render.
 *
 * Order matters and is not arbitrary: a plan that does not include a feature
 * must show the upsell rather than an empty state, and a surface waiting on a
 * production model credential must say «Próximamente» rather than pretend to
 * be loading.
 */
export interface ResolveInput {
  readonly loading?: boolean;
  readonly error?: boolean;
  readonly entitled?: boolean;
  readonly llmBacked?: boolean;
  readonly llmEnabled?: boolean;
  readonly isEmpty?: boolean;
}

export function resolveScreenState(input: ResolveInput): ScreenState {
  if (input.entitled === false) return 'locked';
  if (input.llmBacked === true && input.llmEnabled !== true) return 'proximamente';
  if (input.error === true) return 'error';
  if (input.loading === true) return 'loading';
  if (input.isEmpty === true) return 'empty';
  return 'happy';
}

/** Does this plan include NIF statements? Xangarrito does not (ADR-059). */
export function hasStatements(c: Capabilities): boolean {
  return c.estadosFinancieros;
}

/** The Asesor's cadence decides how much of its surface is live. */
export function asesorShowsDiagnostico(c: Capabilities): boolean {
  return c.asesor === 'completo';
}

/** Convenience for screens that only need "may I render a write control?". */
export function writeAffordances(session: Session): boolean {
  return canWrite(session.role);
}
