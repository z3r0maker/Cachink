/**
 * Whether a request to the landing pixel came from a machine (N-58).
 *
 * The pixel is public, so anything that loads an image is counted. On the
 * first day of real data, four of six hits came from a datacentre with no
 * human behind them — crawlers, uptime checks and the platform's own fetches.
 * Left in, they would quietly become the busiest "visitor" in a state and the
 * numbers would inform a budget.
 *
 * This is a filter, not a defence: anyone who wants to be counted can be. It
 * errs toward **keeping** a hit, because a missed bot skews a number while a
 * discarded human loses one permanently — except for a request with no
 * user-agent at all, which no browser sends.
 */
const TOKENS = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'curl',
  'wget',
  'python-requests',
  'node-fetch',
  'axios',
  'headless',
  'lighthouse',
  'monitor',
  'uptime',
  'pingdom',
  'preview',
  'facebookexternalhit',
  'vercel',
  'phantomjs',
  'puppeteer',
  'playwright',
] as const;

export function looksAutomated(userAgent: string | null): boolean {
  const ua = (userAgent ?? '').trim().toLowerCase();
  if (ua === '') return true;
  return TOKENS.some((token) => ua.includes(token));
}
