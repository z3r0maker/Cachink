/**
 * Archiving a business (P-08's archive row): the records stay, the devices are
 * unlinked, nobody can sign in. Two rules, both here so the portal and any
 * future back office agree.
 */

/** The billing facts that matter: Stripe's status and whether it is set to end. */
export interface SuscripcionHecho {
  readonly stripeStatus: string;
  readonly cancelAt: string | null;
}

/** Statuses in which Stripe will still charge the card. */
const COBRA = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'];

/** A subscription that will keep charging blocks archiving: cancel first. */
export const suscripcionImpideArchivar = (subs: readonly SuscripcionHecho[]): boolean =>
  subs.some((s) => COBRA.includes(s.stripeStatus) && s.cancelAt === null);

/** The owner confirms by typing the business's name; case and outer spaces do not matter. */
export const confirmaNombre = (nombre: string, escrito: string): boolean =>
  escrito.trim().toLocaleLowerCase('es-MX') === nombre.trim().toLocaleLowerCase('es-MX') &&
  escrito.trim().length > 0;
