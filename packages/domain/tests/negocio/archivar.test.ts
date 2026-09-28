import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { confirmaNombre, suscripcionImpideArchivar } from '../../src/index.js';

/**
 * Archiving a business (P-08): the records stay, the devices unlink, nobody
 * signs in. Two rules, both shared by every surface that asks — a
 * subscription that will keep charging blocks the archive until cancelled,
 * and the owner confirms by typing the business's own name.
 */
describe('suscripcionImpideArchivar', () => {
  const cobrando = (cancelAt: string | null) => ({ stripeStatus: 'active', cancelAt });

  it('a subscription that will still charge blocks archiving', () => {
    assert.equal(suscripcionImpideArchivar([cobrando(null)]), true);
    assert.equal(suscripcionImpideArchivar([{ stripeStatus: 'past_due', cancelAt: null }]), true);
  });

  it('a subscription already set to end, or finished, does not', () => {
    assert.equal(suscripcionImpideArchivar([cobrando('2026-10-01')]), false);
    assert.equal(suscripcionImpideArchivar([{ stripeStatus: 'canceled', cancelAt: null }]), false);
  });

  it('one charging subscription among many is enough; none means free to archive', () => {
    assert.equal(
      suscripcionImpideArchivar([
        { stripeStatus: 'canceled', cancelAt: null },
        { stripeStatus: 'unpaid', cancelAt: null },
      ]),
      true,
    );
    assert.equal(suscripcionImpideArchivar([]), false);
  });
});

describe('confirmaNombre', () => {
  it('case and outer spaces do not matter', () => {
    assert.equal(confirmaNombre('Taquería Don Pedro', '  taquería don pedro '), true);
  });

  it('a different name, or nothing typed, does not confirm', () => {
    assert.equal(confirmaNombre('Taquería Don Pedro', 'Taquería'), false);
    assert.equal(confirmaNombre('Taquería Don Pedro', ''), false);
    assert.equal(confirmaNombre('Taquería Don Pedro', '   '), false);
  });
});
