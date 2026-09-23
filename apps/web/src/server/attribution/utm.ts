/**
 * The campaign that brought someone to signup (N-57).
 *
 * `apps/landing` appends `utm_*` to every signup CTA; until now the portal
 * dropped them, so no campaign could be evaluated. These are labels a marketer
 * chose — not personal data — but they arrive from the client, so every field
 * is trimmed, stripped of control characters and length-capped here.
 *
 * A malformed label becomes empty rather than failing the signup: losing
 * attribution is a nuisance, losing a customer is not.
 */
export interface Utm {
  readonly source: string;
  readonly medium: string;
  readonly campaign: string;
  readonly term: string;
  readonly content: string;
}

/** `''` is the one "not given" value, so a query never handles both '' and NULL. */
export const EMPTY_UTM: Utm = {
  source: '',
  medium: '',
  campaign: '',
  term: '',
  content: '',
} as const;

/** Long enough for any real campaign name, short enough to stay readable. */
export const UTM_MAX = 120;

/** What a Next.js `searchParams` gives for one key. */
type Param = string | string[] | undefined;
export type UtmParams = Readonly<Record<string, Param>> | undefined;

const FIELDS = [
  ['source', 'utm_source'],
  ['medium', 'utm_medium'],
  ['campaign', 'utm_campaign'],
  ['term', 'utm_term'],
  ['content', 'utm_content'],
] as const;

/**
 * Printable characters only. Written as a code-point filter rather than a
 * regex because a control-character class is exactly what `no-control-regex`
 * forbids, and an `eslint-disable` needs an ADR (CLAUDE.md §5).
 */
function printable(value: string): string {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 && code !== 0x7f) out += ch;
  }
  return out;
}

function clean(value: Param): string {
  const first = Array.isArray(value) ? value[0] : value;
  return printable(first ?? '')
    .trim()
    .slice(0, UTM_MAX);
}

export function parseUtm(params: UtmParams): Utm {
  if (params === undefined) return EMPTY_UTM;
  const entries = FIELDS.map(([key, param]) => [key, clean(params[param])] as const);
  return Object.fromEntries(entries) as unknown as Utm;
}
