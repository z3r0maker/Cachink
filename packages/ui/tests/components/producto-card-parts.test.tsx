/**
 * ProductoCard sub-components: QuantityBadge, StockBadge tests.
 *
 * Covers visibility thresholds, color variants, and count formatting.
 */

import { describe, expect, it } from 'vitest';
import { QuantityBadge } from '../../src/components/ProductoCard/quantity-badge';
import { StockBadge } from '../../src/components/ProductoCard/stock-badge';
import { renderWithProviders, screen } from '../test-utils';

describe('QuantityBadge', () => {
  it('renders null when count is 0', () => {
    const { container } = renderWithProviders(<QuantityBadge count={0} />);
    expect(container.querySelector('[data-testid="quantity-badge"]')).toBeNull();
  });

  it('renders null when count is negative', () => {
    const { container } = renderWithProviders(<QuantityBadge count={-1} />);
    expect(container.querySelector('[data-testid="quantity-badge"]')).toBeNull();
  });

  it('renders badge with count > 0', () => {
    renderWithProviders(<QuantityBadge count={3} />);
    expect(screen.getByTestId('quantity-badge')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
  });

  it('defaults to yellow variant', () => {
    renderWithProviders(<QuantityBadge count={1} />);
    expect(screen.getByTestId('quantity-badge')).toBeInTheDocument();
  });

  it('renders with red variant', () => {
    renderWithProviders(<QuantityBadge count={2} variant="red" />);
    expect(screen.getByText('×2')).toBeInTheDocument();
  });
});

describe('StockBadge', () => {
  it('renders stock count text', () => {
    renderWithProviders(<StockBadge stock={10} umbral={5} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
  });

  it('renders with zero stock (out of stock)', () => {
    renderWithProviders(<StockBadge stock={0} umbral={5} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders with stock at threshold (low)', () => {
    renderWithProviders(<StockBadge stock={3} umbral={5} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders with stock above threshold (healthy)', () => {
    renderWithProviders(<StockBadge stock={20} umbral={5} />);
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
