/**
 * FloatingCoinsBackground component tests.
 *
 * Validates that children render, coin particles appear, and the
 * overlay layer doesn't block interaction (pointerEvents: 'none').
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

vi.mock('react-native-svg', () => {
  function make(tag: string) {
    return function Mock(props: Record<string, unknown>) {
      const { children, ...rest } = props;
      return React.createElement(tag, rest, children as never);
    };
  }
  return {
    __esModule: true,
    default: make('svg'),
    Svg: make('svg'),
    G: make('g'),
    Rect: make('rect'),
    Circle: make('circle'),
    Line: make('line'),
    Text: make('text'),
    Path: make('path'),
    Polyline: make('polyline'),
    Polygon: make('polygon'),
  };
});

import { Text } from 'react-native';
import { FloatingCoinsBackground } from '../../src/components/FloatingCoinsBackground/index';
import { renderWithProviders, screen } from '../test-utils';

describe('FloatingCoinsBackground', () => {
  it('renders children', () => {
    renderWithProviders(
      <FloatingCoinsBackground>
        <Text testID="child-content">Hello</Text>
      </FloatingCoinsBackground>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders Lucide icon particles (SVG icons in the coin layer)', () => {
    renderWithProviders(
      <FloatingCoinsBackground>
        <Text>Content</Text>
      </FloatingCoinsBackground>,
    );
    // The layer should contain SVG Lucide-icon child nodes (one per particle).
    const coinLayer = screen.getByTestId('floating-coins-layer');
    expect(coinLayer.children.length).toBeGreaterThan(0);
    // Each particle renders an Animated.View wrapping a Lucide icon.
    const firstChild = coinLayer.children[0] as HTMLElement;
    expect(firstChild).toBeDefined();
    expect(firstChild.querySelector('svg')).not.toBeNull();
  });

  it('coin layer does not block interaction (pointerEvents none)', () => {
    renderWithProviders(
      <FloatingCoinsBackground>
        <Text>Content</Text>
      </FloatingCoinsBackground>,
    );
    const coinLayer = screen.getByTestId('floating-coins-layer');
    // react-native-web may apply pointerEvents via inline style or CSS
    // class. Check both: inline style property and getComputedStyle.
    const inline = coinLayer.style.pointerEvents;
    const computed = window.getComputedStyle(coinLayer).pointerEvents;
    const resolved = inline || computed;
    expect(resolved).toBe('none');
  });

  it('renders with forwarded testID', () => {
    renderWithProviders(
      <FloatingCoinsBackground testID="custom-id">
        <Text>Content</Text>
      </FloatingCoinsBackground>,
    );
    expect(screen.getByTestId('custom-id')).toBeInTheDocument();
  });
});
