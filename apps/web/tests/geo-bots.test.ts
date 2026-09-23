import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { looksAutomated } from '../src/server/geo/bots';

/**
 * The landing pixel is a public endpoint, so anything that loads an image
 * lands in the counter — and on day one of real data, four of the six hits
 * came from a datacentre in California with no human behind them.
 *
 * A user-agent check is not a defence against anyone determined; it is a
 * filter so an uptime checker does not quietly become the busiest visitor in
 * a state. It errs toward *keeping* a hit: a missed bot skews a number, a
 * discarded human loses one permanently.
 */
describe('looksAutomated', () => {
  it('keeps ordinary browsers', () => {
    for (const ua of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
      'Mozilla/5.0 (Linux; Android 14; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0 Mobile Safari/537.36',
    ]) {
      assert.equal(looksAutomated(ua), false, ua);
    }
  });

  it('drops the crawlers and monitors that actually hit a marketing site', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
      'Vercel Edge Functions',
      'curl/8.7.1',
      'python-requests/2.32.3',
      'Better Uptime Bot',
      'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
      'node-fetch/1.0',
      'Chrome-Lighthouse',
    ]) {
      assert.equal(looksAutomated(ua), true, ua);
    }
  });

  it('drops a request with no user-agent at all', () => {
    // A browser always sends one; something that does not is not a visitor.
    assert.equal(looksAutomated(null), true);
    assert.equal(looksAutomated(''), true);
  });

  it('is not fooled by case', () => {
    assert.equal(looksAutomated('SomeThing-BOT/2.0'), true);
  });

  it('does not discard a browser merely for containing a bot-ish substring', () => {
    // "Chrome" contains no bot word, but real UAs do carry odd tokens; the
    // check must be specific enough not to eat them.
    assert.equal(looksAutomated('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0'), false);
  });
});
