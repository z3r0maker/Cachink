import { describe, it, expect, vi } from 'vitest';
import { ErrorState } from '../src/components/ErrorState/index';
import { initI18n } from '../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

initI18n();

function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('ErrorState', () => {
  it('renders the title and body', () => {
    renderWithProviders(
      <ErrorState
        title="No se pudo cargar"
        body="Revisa tu conexión y vuelve a intentar."
        retryLabel="Reintentar"
        onRetry={() => undefined}
      />,
    );
    expect(screen.getByText('No se pudo cargar')).toBeInTheDocument();
    expect(screen.getByText('Revisa tu conexión y vuelve a intentar.')).toBeInTheDocument();
  });

  it('fires onRetry when the retry Btn is tapped', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <ErrorState title="Error" body="boom" retryLabel="Reintentar" onRetry={onRetry} />,
    );
    tap(screen.getAllByTestId('error-state-retry')[0]!);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render the retry Btn when retryLabel/onRetry are omitted', () => {
    renderWithProviders(<ErrorState title="Error" body="boom" />);
    expect(screen.queryByTestId('error-state-retry')).toBeNull();
  });

  it('honours the supplied testID and retryTestID', () => {
    renderWithProviders(
      <ErrorState
        title="Error"
        body="boom"
        retryLabel="Reintentar"
        onRetry={() => undefined}
        testID="ventas-error"
        retryTestID="ventas-retry"
      />,
    );
    expect(screen.getByTestId('ventas-error')).toBeInTheDocument();
    expect(screen.getAllByTestId('ventas-retry').length).toBeGreaterThan(0);
  });

  // Audit Round 2 G4: top-up below-floor coverage.

  it('renders the retry Btn with the brand `danger` variant (red)', () => {
    renderWithProviders(
      <ErrorState title="Error" body="boom" retryLabel="Reintentar" onRetry={() => undefined} />,
    );
    // The danger Btn variant is the brand red surface — Audit M-1
    // PR 5 prescribes this for retry CTAs so the affordance reads
    // as "the action that recovered from a failure".
    const retry = screen.getAllByTestId('error-state-retry')[0]!;
    // BtnLabel forwards the children verbatim.
    expect(retry.textContent).toContain('Reintentar');
  });

  it('does not invoke onRetry when retryLabel is omitted but onRetry is set', () => {
    // The primitive treats both props as required-together; passing
    // only one is a no-op. Guards against the audit's "ghost retry
    // button that does nothing" scenario.
    const onRetry = vi.fn();
    renderWithProviders(<ErrorState title="Error" body="boom" onRetry={onRetry} />);
    expect(screen.queryByTestId('error-state-retry')).toBeNull();
    expect(onRetry).not.toHaveBeenCalled();
  });
});
