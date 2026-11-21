/**
 * «Sello»'s one-time flag (ADR-161 §3): the action that closes a month,
 * approves a plan or a budget, or accepts a card redirects with
 * `?sello=<what>`, and only that render stamps its chip. `SelloUnaVez`
 * removes the flag from the address bar on arrival, so a reload never stamps
 * again. Pure.
 */
export const PARAM_SELLO = 'sello';

export type Sello = 'cerrado' | 'plan' | 'presupuesto' | 'aceptada';

const SELLOS: readonly Sello[] = ['cerrado', 'plan', 'presupuesto', 'aceptada'];

/** `href` with the flag, after whatever query it already has. */
export function conSello(href: string, sello: Sello): string {
  return `${href}${href.includes('?') ? '&' : '?'}${PARAM_SELLO}=${sello}`;
}

/** The flag a page was opened with, or `null` for any other value or none. */
export function parseSello(raw: string | undefined): Sello | null {
  return SELLOS.find((s) => s === raw) ?? null;
}
