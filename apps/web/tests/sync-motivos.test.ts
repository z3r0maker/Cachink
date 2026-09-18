import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ERROR_CATALOG } from '@xangarro/contracts';

import { MENSAJES_DE_RECHAZO, motivoDeRechazo } from '../src/lib/sync-motivos';

describe('motivoDeRechazo', () => {
  it('has a sentence for every per-row push code in the contract', () => {
    const perRow = Object.entries(ERROR_CATALOG).filter(([, e]) => e.httpStatus === 200);
    assert.ok(perRow.length > 0);
    for (const [code, e] of perRow) {
      assert.ok(MENSAJES_DE_RECHAZO[e.userMessageKey], `${code} → ${e.userMessageKey}`);
    }
  });

  it('never shows a code to the owner', () => {
    assert.equal(
      motivoDeRechazo('FK_PRODUCT_MISSING'),
      'El producto de este registro ya no existe en el portal.',
    );
    assert.doesNotMatch(motivoDeRechazo('SOMETHING_NEW'), /[A-Z]{3,}_/);
  });
});
