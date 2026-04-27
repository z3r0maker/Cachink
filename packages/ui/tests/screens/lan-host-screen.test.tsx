/**
 * LanHostScreen tests (Slice 8 M3-C12).
 *
 * Three render branches the screen has:
 *   1. starting — shown while `startServer()` is in flight
 *   2. error — shown when `startServer()` rejects
 *   3. ready — shown when `startServer()` resolves; renders QR + URL +
 *      pairing token + a "Continue" CTA that fires `onContinue`
 */

import { describe, expect, it, vi } from 'vitest';
import { LanHostScreen } from '../../src/screens/LanPairing/lan-host-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const STUB_RESULT = {
  url: 'http://192.168.1.5:43812',
  pairingToken: 'pair-token-xyz',
  qrPngBase64: 'AAAA',
};

describe('LanHostScreen (Slice 8 M3-C12)', () => {
  it('renders the starting message immediately on mount', () => {
    // Resolves never — hold the screen in the starting state.
    const startServer = vi.fn(() => new Promise<typeof STUB_RESULT>(() => {}));
    renderWithProviders(<LanHostScreen startServer={startServer} onContinue={vi.fn()} />);
    expect(screen.getByTestId('lan-host-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('lan-host-qr-card')).toBeNull();
    expect(screen.queryByTestId('lan-host-error')).toBeNull();
  });

  it('renders the QR + URL + token + continue CTA after startServer resolves', async () => {
    const startServer = vi.fn().mockResolvedValue(STUB_RESULT);
    renderWithProviders(<LanHostScreen startServer={startServer} onContinue={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('lan-host-qr-card')).toBeInTheDocument();
    });
    expect(screen.getByTestId('lan-host-qr-img')).toBeInTheDocument();
    expect(screen.getByTestId('lan-host-continue')).toBeInTheDocument();
    // URL + token are rendered in the detail rows.
    expect(screen.getByText(STUB_RESULT.url)).toBeInTheDocument();
    expect(screen.getByText(STUB_RESULT.pairingToken)).toBeInTheDocument();
  });

  it('renders the error message when startServer rejects', async () => {
    const startServer = vi.fn().mockRejectedValue(new Error('Permission denied'));
    renderWithProviders(<LanHostScreen startServer={startServer} onContinue={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByTestId('lan-host-error').textContent).toMatch(/Permission denied/);
    });
    expect(screen.queryByTestId('lan-host-qr-card')).toBeNull();
  });

  it('fires onContinue with the start result when the CTA is pressed', async () => {
    const startServer = vi.fn().mockResolvedValue(STUB_RESULT);
    const onContinue = vi.fn();
    renderWithProviders(<LanHostScreen startServer={startServer} onContinue={onContinue} />);
    await waitFor(() => {
      expect(screen.getByTestId('lan-host-continue')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('lan-host-continue'));
    expect(onContinue).toHaveBeenCalledWith(STUB_RESULT);
  });
});
