import { describe, it, expect } from 'vitest';
import { HelloBadge } from '../src/components/HelloBadge/index';
import { renderWithProviders, screen } from './test-utils';

describe('HelloBadge', () => {
  it('renders the default label and greeting text', () => {
    renderWithProviders(<HelloBadge />);
    expect(screen.getByText('CACHINK!')).toBeDefined();
    expect(screen.getByText('Hola, emprendedor.')).toBeDefined();
  });

  it('renders a custom label and greeting when props are provided', () => {
    renderWithProviders(<HelloBadge label="Hola" greeting="Mundo" />);
    expect(screen.getByText('Hola')).toBeDefined();
    expect(screen.getByText('Mundo')).toBeDefined();
  });

  it('exposes the hello-badge testID so E2E tests and snapshots can anchor to it', () => {
    renderWithProviders(<HelloBadge />);
    // Tamagui wraps styled primitives in several layers — any match is good.
    expect(screen.getAllByTestId('hello-badge').length).toBeGreaterThan(0);
  });
});
