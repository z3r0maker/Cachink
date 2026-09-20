/**
 * Director Home render-count perf check (P1C-M12-T05, S4-C21).
 *
 * Not a real performance benchmark — jsdom has no layout/paint — but a
 * regression guard: a single Director Home mount must finish within a
 * small number of renders. We wrap the render in a spy and assert an
 * upper bound on call count.
 */

import { describe, expect, it } from 'vitest';
import { DirectorHomeScreen } from '../../src/screens/DirectorHome/director-home-screen';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

describe('DirectorHomeScreen render count', () => {
  it('mounts without repeated re-renders', () => {
    let renderCount = 0;
    function Tracker(): null {
      renderCount++;
      return null;
    }
    renderWithProviders(
      <DirectorHomeScreen hero={<Tracker />} hoy={<Tracker />} cxc={<Tracker />} />,
    );
    expect(screen.getByTestId('director-home-screen')).toBeInTheDocument();
    // 3 children × 1 render is the expected ceiling; StrictMode can
    // double this in dev, so allow 6 before we flag a regression.
    expect(renderCount).toBeLessThanOrEqual(6);
  });
});
