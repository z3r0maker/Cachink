/**
 * CachinkBurst component tests.
 *
 * Validates that the "¡CACHINK!" celebration overlay renders/hides
 * correctly and calls onComplete after the animation duration.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { CachinkBurst } from '../../src/components/CachinkBurst/index';
import { renderWithProviders, screen } from '../test-utils';

describe('CachinkBurst', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when visible is false', () => {
    renderWithProviders(<CachinkBurst visible={false} onComplete={vi.fn()} />);
    expect(screen.queryByTestId('cachink-burst')).toBeNull();
  });

  it('renders the overlay when visible is true', () => {
    renderWithProviders(<CachinkBurst visible={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId('cachink-burst')).toBeInTheDocument();
  });

  it('renders "¡CACHINK!" text', () => {
    renderWithProviders(<CachinkBurst visible={true} onComplete={vi.fn()} />);
    expect(screen.getByText('¡CACHINK!')).toBeInTheDocument();
  });

  it('renders with a custom testID', () => {
    renderWithProviders(
      <CachinkBurst visible={true} onComplete={vi.fn()} testID="custom-burst" />,
    );
    expect(screen.getByTestId('custom-burst')).toBeInTheDocument();
  });

  it('overlay does not block interaction (pointerEvents none)', () => {
    renderWithProviders(<CachinkBurst visible={true} onComplete={vi.fn()} />);
    const overlay = screen.getByTestId('cachink-burst');
    const inline = overlay.style.pointerEvents;
    const computed = window.getComputedStyle(overlay).pointerEvents;
    const resolved = inline || computed;
    expect(resolved).toBe('none');
  });

  it('calls onComplete after animation duration', () => {
    const onComplete = vi.fn();
    renderWithProviders(<CachinkBurst visible={true} onComplete={onComplete} />);

    // The animation should complete within ~900ms
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1200);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
