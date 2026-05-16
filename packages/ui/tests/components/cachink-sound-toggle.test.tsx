/**
 * CachinkSoundToggle component tests.
 *
 * Validates render, label text, toggle interaction, and custom testID.
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';

// Mock lucide icons (required for the Icon component)
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

import { CachinkSoundToggle } from '../../src/screens/Settings/cachink-sound-toggle';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

describe('CachinkSoundToggle', () => {
  it('renders with default testID', () => {
    renderWithProviders(
      <CachinkSoundToggle enabled={true} onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('settings-cachink-sound-toggle')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <CachinkSoundToggle enabled={true} onChange={vi.fn()} testID="custom" />,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('shows yes label when enabled', () => {
    renderWithProviders(
      <CachinkSoundToggle enabled={true} onChange={vi.fn()} />,
    );
    // In test env, i18n returns raw keys; the key is 'common.yes'
    expect(screen.getByTestId('settings-cachink-sound-btn')).toHaveTextContent('common.yes');
  });

  it('shows no label when disabled', () => {
    renderWithProviders(
      <CachinkSoundToggle enabled={false} onChange={vi.fn()} />,
    );
    expect(screen.getByTestId('settings-cachink-sound-btn')).toHaveTextContent('common.no');
  });

  it('calls onChange with toggled value on press', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CachinkSoundToggle enabled={true} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('settings-cachink-sound-btn'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange(true) when currently disabled', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CachinkSoundToggle enabled={false} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('settings-cachink-sound-btn'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
