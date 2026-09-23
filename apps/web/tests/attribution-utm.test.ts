import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { EMPTY_UTM, UTM_MAX, parseUtm } from '../src/server/attribution/utm';

/**
 * The campaign labels a marketer chose, read off the signup URL (N-57).
 *
 * They arrive from the client, so nothing here trusts them: every field is
 * trimmed, length-capped and stripped of anything that would make a stored
 * label unreadable. A malformed one becomes empty rather than rejecting the
 * signup — losing attribution is a nuisance, losing a customer is not.
 */
describe('parseUtm', () => {
  it('keeps the five standard parameters', () => {
    assert.deepEqual(
      parseUtm({
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'taquerias-gdl',
        utm_term: 'punto de venta',
        utm_content: 'video-a',
      }),
      {
        source: 'facebook',
        medium: 'cpc',
        campaign: 'taquerias-gdl',
        term: 'punto de venta',
        content: 'video-a',
      },
    );
  });

  it('fills the missing ones with empty strings rather than nulls', () => {
    // One column shape, one empty value: '' means "not given" everywhere,
    // so a query never has to handle both '' and NULL.
    assert.deepEqual(parseUtm({ utm_source: 'instagram' }), {
      ...EMPTY_UTM,
      source: 'instagram',
    });
    assert.deepEqual(parseUtm({}), EMPTY_UTM);
  });

  it('trims surrounding whitespace', () => {
    assert.equal(parseUtm({ utm_source: '  google  ' }).source, 'google');
  });

  it('takes the first value when a parameter is repeated', () => {
    // Next gives string[] for ?utm_source=a&utm_source=b.
    assert.equal(parseUtm({ utm_source: ['primero', 'segundo'] }).source, 'primero');
  });

  it('caps a long label instead of letting it reach the database', () => {
    const long = 'c'.repeat(UTM_MAX + 50);
    assert.equal(parseUtm({ utm_campaign: long }).campaign.length, UTM_MAX);
  });

  it('drops control characters, which would make a stored label unreadable', () => {
    assert.equal(parseUtm({ utm_source: 'face\u0000book\n' }).source, 'facebook');
  });

  it('ignores anything that is not one of the five', () => {
    const parsed = parseUtm({ utm_source: 'x', gclid: 'abc', plan: 'xangarro' });
    assert.deepEqual(parsed, { ...EMPTY_UTM, source: 'x' });
  });

  it('answers the same shape for a visit with no campaign at all', () => {
    // Direct traffic is the common case and must not look like an error.
    assert.deepEqual(parseUtm(undefined), EMPTY_UTM);
  });
});
