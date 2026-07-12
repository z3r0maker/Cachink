/**
 * SafeAreaSpacer tests — web no-op variant.
 */

import { describe, expect, it } from 'vitest';
import { SafeAreaSpacer } from '../../src/components/SafeAreaSpacer/safe-area-spacer';
import { renderWithProviders } from '../test-utils';

describe('SafeAreaSpacer (web)', () => {
  it('renders without crashing (no-op on web)', () => {
    const { container } = renderWithProviders(<SafeAreaSpacer />);
    expect(container).toBeTruthy();
  });

  it('accepts edge prop without crashing', () => {
    const { container } = renderWithProviders(<SafeAreaSpacer edge="bottom" />);
    expect(container).toBeTruthy();
  });
});
