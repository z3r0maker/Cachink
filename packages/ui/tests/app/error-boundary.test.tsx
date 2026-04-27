/**
 * AppErrorBoundary tests (P1C-M12-T01, S4-C14).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';
import { AppErrorBoundary } from '../../src/app/error-boundary';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function Thrower({ shouldThrow }: { shouldThrow: boolean }): ReactElement {
  if (shouldThrow) throw new Error('boom');
  return <div data-testid="thrower-child">OK</div>;
}

describe('AppErrorBoundary', () => {
  let consoleErr: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    // React logs uncaught boundary errors; silence to keep test output clean.
    consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children in the happy path', () => {
    renderWithProviders(
      <AppErrorBoundary>
        <Thrower shouldThrow={false} />
      </AppErrorBoundary>,
    );
    expect(screen.getByTestId('thrower-child')).toBeInTheDocument();
    consoleErr.mockRestore();
  });

  it('renders the fallback when a child throws', () => {
    renderWithProviders(
      <AppErrorBoundary>
        <Thrower shouldThrow={true} />
      </AppErrorBoundary>,
    );
    expect(screen.getByTestId('app-error-boundary')).toBeInTheDocument();
    expect(screen.getByTestId('app-error-boundary-reset')).toBeInTheDocument();
    expect(screen.getByTestId('app-error-boundary-copy')).toBeInTheDocument();
    consoleErr.mockRestore();
  });

  it('calls onError + onReset callbacks', () => {
    const onError = vi.fn();
    const onReset = vi.fn();
    renderWithProviders(
      <AppErrorBoundary onError={onError} onReset={onReset}>
        <Thrower shouldThrow={true} />
      </AppErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({}));
    fireEvent.click(screen.getAllByTestId('app-error-boundary-reset')[0]!);
    expect(onReset).toHaveBeenCalled();
    consoleErr.mockRestore();
  });

  it('copies error detail to navigator.clipboard when "Copiar" is tapped', () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    renderWithProviders(
      <AppErrorBoundary>
        <Thrower shouldThrow={true} />
      </AppErrorBoundary>,
    );
    fireEvent.click(screen.getAllByTestId('app-error-boundary-copy')[0]!);
    expect(writeText).toHaveBeenCalled();
    consoleErr.mockRestore();
  });
});
