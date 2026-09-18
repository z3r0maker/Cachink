/**
 * rules.ts — what the App Store (Mexico storefront) and Play will not accept
 * in a business-employee app (ADR-069): plan names, prices, calls to buy or
 * upgrade, links that steer to the web portal, and licence/unlock wording.
 *
 * POS vocabulary is not a violation. A shop charging its own customers
 * ("Cobrar", "Precio de venta", "Pagar con tarjeta", "¡Gracias por su
 * compra!") sells goods in the physical world, which Guideline 3.1.3(e)
 * explicitly permits. So the ambiguous verbs (`compra`, `pagar`, `precio`,
 * `mejorar`) only fire next to a subscription cue (`plan`, `Xangarro`,
 * `ilimitado`, `límite`…), and a peso amount only fires next to a billing
 * period.
 */

export interface Rule {
  readonly id: string;
  readonly message: string;
  /** Neutral wording to use instead. */
  readonly suggestion: string;
  /** Lowercase identifier-like tokens (enum values) are only checked when true. */
  readonly checksCodeTokens: boolean;
  readonly test: (text: string) => boolean;
}

const SUBSCRIPTION_CUE = /\bplan(es)?\b|xangarro|suscrip|ilimitad|licencia|l[ií]mite|dispositivos/i;
const BILLING_PERIOD =
  /\/\s?(mes|año)\b|\b(al|por) (mes|año)\b|\banual\b|\bmensual|\+\s?iva\b|\bplan\b/i;
const AMOUNT = /\$\s?\d|\bMXN\b|\d\s?pesos\b/i;

const STRONG_PURCHASE =
  /upgrade|suscr[ií]b|suscripci[oó]n|prueba gratis|\btrial\b|premium|mejora tu plan|cambia tu plan|renueva|renovar|contrata/i;
const WEAK_PURCHASE = /\bmejor(a|ar)\b|\bcompr(a|ar)\b|\bpagar\b|\bprecios?\b|\badquier/i;

export const RULES: readonly Rule[] = [
  {
    id: 'store/plan-name',
    message: 'Names a subscription plan.',
    suggestion: 'Drop the plan name; say what happens ("El dueño del negocio ya fue avisado.").',
    checksCodeTokens: false,
    test: (s) =>
      /xangarrit|xangarrot|plan\s+xangarro|mipyme\s*pro|freelancer|\bplan(es)?\b/i.test(s),
  },
  {
    id: 'store/price',
    message: 'Shows a price or billing period for the service.',
    suggestion: 'Remove the amount; pricing lives only in the portal and email.',
    checksCodeTokens: false,
    test: (s) => AMOUNT.test(s) && BILLING_PERIOD.test(s),
  },
  {
    id: 'store/purchase-cta',
    message: 'Calls the user to buy, upgrade, subscribe or renew.',
    suggestion: 'Use a neutral notice: "Pide al dueño del negocio que revise su cuenta."',
    checksCodeTokens: false,
    test: (s) => STRONG_PURCHASE.test(s) || (WEAK_PURCHASE.test(s) && SUBSCRIPTION_CUE.test(s)),
  },
  {
    id: 'store/web-link',
    message:
      'Links or points to the web portal/site (steering). Support e-mail addresses are fine.',
    suggestion: 'Say "Pídelo al dueño del negocio." with no URL.',
    checksCodeTokens: true,
    test: (s) =>
      /\b(app|www|portal)\.(xangarro|cachink)\.(mx|app|com)|(?<![@a-z0-9-]\.|@)\b(xangarro|cachink)\.(mx|app|com)/i.test(
        s,
      ),
  },
  {
    id: 'store/web-url',
    message: 'Shows a web URL inside a sentence.',
    suggestion: 'Remove the URL from user-visible text.',
    checksCodeTokens: false,
    // Prose only: a bare URL string is configuration (LAN host, API base); a
    // bare portal URL is still caught by store/web-link.
    test: (s) => /\s/.test(s.trim()) && /https?:\/\//i.test(s),
  },
  {
    id: 'store/licensing',
    message: 'Uses licence/activation/unlock wording (Guideline 3.1.1 names licence keys).',
    suggestion: 'Use "Vincular este dispositivo a tu negocio".',
    checksCodeTokens: false,
    test: (s) =>
      /licencia|desbloque|\bactiva(r|rse|rlo|rla|do de nuevo)\b|activaci[oó]n|\bunlock|\blicen[cs]e|\bactivate/i.test(
        s,
      ),
  },
];

/** Ids of every rule `text` breaks. */
export function matchRules(text: string, codeToken: boolean): readonly string[] {
  return RULES.filter((r) => (r.checksCodeTokens || !codeToken) && r.test(text)).map((r) => r.id);
}
