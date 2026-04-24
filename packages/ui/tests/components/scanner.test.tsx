/**
 * Scanner (web-variant baseline) tests (Slice 2 C16-C17).
 *
 * Exercises the stub web implementation: manual entry + submit +
 * close. The native-camera variant (scanner.native.tsx) is verified
 * via Maestro in Commit 24.
 */

import { describe, expect, it, vi } from 'vitest';
import { Scanner } from '../../src/components/Scanner/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('Scanner (web)', () => {
  it('renders when open with the manual-entry fallback field', () => {
    renderWithProviders(<Scanner open onClose={vi.fn()} onScan={vi.fn()} />);
    expect(screen.getByTestId('scanner-manual')).toBeInTheDocument();
    expect(screen.getByTestId('scanner-manual-submit')).toBeInTheDocument();
  });

  it('does not fire onScan with an empty manual code', () => {
    const onScan = vi.fn();
    renderWithProviders(<Scanner open onClose={vi.fn()} onScan={onScan} />);
    const btn = screen.getAllByTestId('scanner-manual-submit')[0]!;
    fireEvent.click(btn);
    expect(onScan).not.toHaveBeenCalled();
  });

  it('invokes onClose when the Cerrar Btn is tapped', () => {
    const onClose = vi.fn();
    renderWithProviders(<Scanner open onClose={onClose} onScan={vi.fn()} />);
    const btn = screen.getAllByTestId('scanner-close')[0]!;
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });
});
