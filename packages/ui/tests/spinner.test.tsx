/**
 * Spinner component tests.
 */

import { describe, it, expect } from 'vitest';
import { Spinner } from '../src/components/Spinner/index';
import { renderWithProviders, screen } from './test-utils';

describe('Spinner', () => {
  it('renders with default testID', () => {
    renderWithProviders(<Spinner />);
    expect(screen.getByTestId('spinner')).toBeDefined();
  });

  it('accepts custom testID', () => {
    renderWithProviders(<Spinner testID="my-spinner" />);
    expect(screen.getByTestId('my-spinner')).toBeDefined();
  });

  it('renders at default md size', () => {
    renderWithProviders(<Spinner />);
    expect(screen.getByTestId('spinner')).toBeDefined();
  });

  it('renders at sm size', () => {
    renderWithProviders(<Spinner size="sm" />);
    expect(screen.getByTestId('spinner')).toBeDefined();
  });

  it('renders at lg size', () => {
    renderWithProviders(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner')).toBeDefined();
  });

  it('renders at xl size', () => {
    renderWithProviders(<Spinner size="xl" />);
    expect(screen.getByTestId('spinner')).toBeDefined();
  });
});
