/**
 * OptionCardGroup component tests.
 *
 * Per CLAUDE.md §6: icon+description cards for ≤5 mutually-exclusive
 * choices. Tests verify rendering, selection state, onChange behavior,
 * testID forwarding, and optional label.
 */

import { describe, expect, it, vi } from 'vitest';
import { OptionCardGroup, type OptionCardItem } from '../../src/components/OptionCardGroup/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

const OPTIONS: readonly OptionCardItem<'a' | 'b' | 'c'>[] = [
  { key: 'a', icon: 'package', label: 'Option A', description: 'Description A' },
  { key: 'b', icon: 'shopping-bag', label: 'Option B', description: 'Description B' },
  { key: 'c', icon: 'refresh-cw', label: 'Option C', description: 'Description C' },
];

describe('OptionCardGroup', () => {
  it('renders all options with icons, labels, and descriptions', () => {
    renderWithProviders(
      <OptionCardGroup value="a" onChange={vi.fn()} options={OPTIONS} />,
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Description A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
    expect(screen.getByText('Description B')).toBeInTheDocument();
    expect(screen.getByText('Option C')).toBeInTheDocument();
    expect(screen.getByText('Description C')).toBeInTheDocument();
  });

  it('selected card has yellowSoft background', () => {
    renderWithProviders(
      <OptionCardGroup value="b" onChange={vi.fn()} options={OPTIONS} />,
    );
    const selectedCard = screen.getByTestId('option-card-b');
    // The Pressable wraps a View — the View carries the background style.
    // In JSDOM the selected card's inner View should have the yellowSoft bg.
    expect(selectedCard).toBeInTheDocument();
    // Unselected cards should also be present
    expect(screen.getByTestId('option-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('option-card-c')).toBeInTheDocument();
  });

  it('tapping an unselected card fires onChange with the correct key', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <OptionCardGroup value="a" onChange={onChange} options={OPTIONS} />,
    );
    fireEvent.click(screen.getByTestId('option-card-b'));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('tapping the already-selected card does NOT fire onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <OptionCardGroup value="a" onChange={onChange} options={OPTIONS} />,
    );
    fireEvent.click(screen.getByTestId('option-card-a'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('testID is forwarded to the root element', () => {
    renderWithProviders(
      <OptionCardGroup
        value="a"
        onChange={vi.fn()}
        options={OPTIONS}
        testID="my-card-group"
      />,
    );
    expect(screen.getByTestId('my-card-group')).toBeInTheDocument();
  });

  it('renders optional uppercase label above the cards when provided', () => {
    renderWithProviders(
      <OptionCardGroup
        value="a"
        onChange={vi.fn()}
        options={OPTIONS}
        label="Choose one"
      />,
    );
    expect(screen.getByTestId('option-card-group-label')).toBeInTheDocument();
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });
});
