/**
 * SaleBurst component tests.
 *
 * Validates that the "¡XANGARRO!" celebration overlay renders/hides
 * correctly and calls onComplete after the animation duration.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { SaleBurst } from '../../src/components/SaleBurst/index';
import { renderWithProviders, screen } from '../test-utils';

describe('SaleBurst', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when visible is false', () => {
    renderWithProviders(<SaleBurst visible={false} onComplete={vi.fn()} />);
    expect(screen.queryByTestId('sale-burst')).toBeNull();
  });

  it('renders the overlay when visible is true', () => {
    renderWithProviders(<SaleBurst visible={true} onComplete={vi.fn()} />);
    expect(screen.getByTestId('sale-burst')).toBeInTheDocument();
  });

  it('renders "¡XANGARRO!" text', () => {
    renderWithProviders(<SaleBurst visible={true} onComplete={vi.fn()} />);
    expect(screen.getByText('¡XANGARRO!')).toBeInTheDocument();
  });

  it('renders with a custom testID', () => {
    renderWithProviders(<SaleBurst visible={true} onComplete={vi.fn()} testID="custom-burst" />);
    expect(screen.getByTestId('custom-burst')).toBeInTheDocument();
  });

  it('overlay does not block interaction (pointerEvents none)', () => {
    renderWithProviders(<SaleBurst visible={true} onComplete={vi.fn()} />);
    const overlay = screen.getByTestId('sale-burst');
    const inline = overlay.style.pointerEvents;
    const computed = window.getComputedStyle(overlay).pointerEvents;
    const resolved = inline || computed;
    expect(resolved).toBe('none');
  });

  it('calls onComplete after animation duration', () => {
    const onComplete = vi.fn();
    renderWithProviders(<SaleBurst visible={true} onComplete={onComplete} />);

    // The animation should complete within ~900ms
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1200);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
