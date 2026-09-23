import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';
import { PLATFORM_FLAG_DEFAULTS } from '@xangarro/domain';

vi.mock('server-only', () => ({}));
const { platformDefaults } = await import('../src/server/billing/plan');

/** N-09: the Asesor's model is off in production until staff turn it on; locally nothing is gated. */
describe('platformDefaults', () => {
  it('keeps every kill switch at its code default in production', () => {
    assert.deepEqual(platformDefaults('production'), PLATFORM_FLAG_DEFAULTS);
    assert.equal(platformDefaults('production').asesorLlm, false);
  });

  it('turns the Asesor on outside production, and nothing else', () => {
    const dev = platformDefaults('development');
    assert.equal(dev.asesorLlm, true);
    assert.deepEqual(
      { ...dev, asesorLlm: PLATFORM_FLAG_DEFAULTS.asesorLlm },
      PLATFORM_FLAG_DEFAULTS,
    );
  });
});
