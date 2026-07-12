/**
 * Callout component tests.
 */

import { describe, it, expect } from 'vitest';
import { Callout } from '../src/components/Callout/index';
import { renderWithProviders, screen } from './test-utils';

describe('Callout', () => {
  it('renders the body text', () => {
    renderWithProviders(<Callout body="Tus datos se conservan" />);
    expect(screen.getByText('Tus datos se conservan')).toBeDefined();
  });

  it('renders the title when provided', () => {
    renderWithProviders(
      <Callout title="Importante" body="Tus datos se conservan" />,
    );
    expect(screen.getByText('Importante')).toBeDefined();
    expect(screen.getByText('Tus datos se conservan')).toBeDefined();
  });

  it('renders without title when omitted', () => {
    renderWithProviders(<Callout body="Solo el body" />);
    expect(screen.getByText('Solo el body')).toBeDefined();
  });

  it('renders icon emoji when provided', () => {
    renderWithProviders(<Callout body="Info" icon="ℹ️" />);
    expect(screen.getByText('ℹ️')).toBeDefined();
  });

  it('uses default testID', () => {
    renderWithProviders(<Callout body="Test" />);
    expect(screen.getByTestId('callout')).toBeDefined();
  });

  it('accepts custom testID', () => {
    renderWithProviders(<Callout body="Test" testID="custom-callout" />);
    expect(screen.getByTestId('custom-callout')).toBeDefined();
  });

  it('renders action slot when provided', () => {
    renderWithProviders(
      <Callout body="Click me" action={<button data-testid="action-btn">Go</button>} />,
    );
    expect(screen.getByTestId('action-btn')).toBeDefined();
  });

  it('defaults to info tone', () => {
    renderWithProviders(<Callout body="Info callout" />);
    // Simply verifies it renders without error (tone style is applied)
    expect(screen.getByTestId('callout')).toBeDefined();
  });

  it('renders with success tone', () => {
    renderWithProviders(<Callout body="Success" tone="success" />);
    expect(screen.getByTestId('callout')).toBeDefined();
  });

  it('renders with warning tone', () => {
    renderWithProviders(<Callout body="Warning" tone="warning" />);
    expect(screen.getByTestId('callout')).toBeDefined();
  });
});
