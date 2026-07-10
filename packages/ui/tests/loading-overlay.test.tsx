/**
 * LoadingOverlay component tests.
 */

import { describe, it, expect } from 'vitest';
import { LoadingOverlay } from '../src/components/LoadingOverlay/index';
import { renderWithProviders, screen } from './test-utils';

describe('LoadingOverlay', () => {
  it('renders the spinner when visible', () => {
    renderWithProviders(<LoadingOverlay visible={true} />);
    expect(screen.getByTestId('loading-overlay-spinner')).toBeDefined();
  });

  it('renders message text when provided', () => {
    renderWithProviders(
      <LoadingOverlay visible={true} message="Cargando datos..." />,
    );
    expect(screen.getByText('Cargando datos...')).toBeDefined();
  });

  it('does not render message when omitted', () => {
    renderWithProviders(<LoadingOverlay visible={true} />);
    expect(screen.queryByText('Cargando datos...')).toBeNull();
  });

  it('uses default testID', () => {
    renderWithProviders(<LoadingOverlay visible={true} />);
    expect(screen.getByTestId('loading-overlay')).toBeDefined();
  });

  it('accepts custom testID', () => {
    renderWithProviders(
      <LoadingOverlay visible={true} testID="custom-overlay" />,
    );
    expect(screen.getByTestId('custom-overlay')).toBeDefined();
  });
});
