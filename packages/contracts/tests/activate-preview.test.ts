import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  ActivatePreviewRequestSchema,
  ActivatePreviewResponseSchema,
  PREVIEW_ERROR_CODES,
} from '../src/activate-preview.js';
import { ERROR_CATALOG } from '../src/errors.js';

const PREVIEW = {
  businessName: 'Taquería Don Pedro',
  ownerFirstName: 'Pedro',
  ownerEmail: 'pedro@taqueriadonpedro.mx',
};

describe('activate preview contract (N-25)', () => {
  it('reads the business name and the owner, with either owner field missing', () => {
    assert.deepEqual(ActivatePreviewResponseSchema.parse(PREVIEW), PREVIEW);
    const sinNombre = { ...PREVIEW, ownerFirstName: null };
    assert.deepEqual(ActivatePreviewResponseSchema.parse(sinNombre), sinNombre);
    const sinDueno = { ...PREVIEW, ownerFirstName: null, ownerEmail: null };
    assert.deepEqual(ActivatePreviewResponseSchema.parse(sinDueno), sinDueno);
  });

  it('refuses any field beyond the three: an extra one would be a leak', () => {
    const r = ActivatePreviewResponseSchema.safeParse({ ...PREVIEW, businessId: 'b-1' });
    assert.equal(r.success, false);
  });

  it('refuses an empty business name and an owner email that is not one', () => {
    assert.equal(
      ActivatePreviewResponseSchema.safeParse({ ...PREVIEW, businessName: '' }).success,
      false,
    );
    assert.equal(
      ActivatePreviewResponseSchema.safeParse({ ...PREVIEW, ownerEmail: 'pedro' }).success,
      false,
    );
  });

  it('takes the pairing token alone, and only a well-formed one', () => {
    assert.equal(ActivatePreviewRequestSchema.safeParse({ qrToken: 'A'.repeat(22) }).success, true);
    assert.equal(ActivatePreviewRequestSchema.safeParse({ qrToken: 'short' }).success, false);
    assert.equal(ActivatePreviewRequestSchema.safeParse({}).success, false);
  });

  it('answers only with refusals the catalog knows, all of them terminal', () => {
    for (const code of PREVIEW_ERROR_CODES) assert.equal(ERROR_CATALOG[code].retryable, false);
  });
});
