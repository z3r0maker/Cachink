/**
 * ActivityTracker tests — invisible touch interceptor.
 */

import { describe, expect, it, vi } from 'vitest';
import { ActivityTracker } from '../../src/components/ActivityTracker/activity-tracker';
import { renderWithProviders, screen } from '../test-utils';

describe('ActivityTracker', () => {
  it('renders children', () => {
    renderWithProviders(
      <ActivityTracker onActivity={vi.fn()}>
        <span data-testid="child">OK</span>
      </ActivityTracker>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <ActivityTracker onActivity={vi.fn()} testID="tracker">
        <span>OK</span>
      </ActivityTracker>,
    );
    expect(screen.getByTestId('tracker')).toBeInTheDocument();
  });
});
