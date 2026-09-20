/**
 * LanJoinScreen tests (Slice 8 M3-C12).
 *
 * Covers the join flow's three primary paths — paste-URL happy path,
 * paste-URL malformed, scan-QR + onPaired — and the error display.
 */

import { describe, expect, it, vi } from 'vitest';
import { LanJoinScreen, parseLanQrPayload } from '../../src/screens/LanPairing/lan-join-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

function getInput(testId: string): HTMLInputElement {
  return screen.getByTestId(testId).querySelector('input') as HTMLInputElement;
}

const STUB_PAIR_SUCCESS = {
  serverUrl: 'http://192.168.1.5:43812',
  accessToken: 'real-token-abc',
  businessId: '01HX9999999999999999999999',
};

describe('parseLanQrPayload', () => {
  it('returns serverUrl + token for a valid cachink-lan:// payload', () => {
    const parsed = parseLanQrPayload('cachink-lan://192.168.1.5:43812?token=abc123');
    expect(parsed).toEqual({
      serverUrl: 'http://192.168.1.5:43812',
      pairingToken: 'abc123',
    });
  });

  it('returns null for empty input', () => {
    expect(parseLanQrPayload('')).toBeNull();
    expect(parseLanQrPayload('   ')).toBeNull();
  });

  it('returns null when the token query param is missing', () => {
    expect(parseLanQrPayload('http://192.168.1.5:43812')).toBeNull();
  });
});

describe('LanJoinScreen (Slice 8 M3-C12)', () => {
  it('renders the paste section + does NOT render the scan CTA when no scanner is provided (desktop branch)', () => {
    const pair = vi.fn().mockResolvedValue(STUB_PAIR_SUCCESS);
    renderWithProviders(<LanJoinScreen pair={pair} onPaired={vi.fn()} deviceId="DEV-1" />);
    expect(screen.getByTestId('lan-join-screen')).toBeInTheDocument();
    expect(screen.getByTestId('lan-join-paste-input')).toBeInTheDocument();
    expect(screen.queryByTestId('lan-join-scan')).toBeNull();
  });

  it('renders the scan CTA when an onOpenScanner is provided (mobile branch)', () => {
    renderWithProviders(
      <LanJoinScreen
        pair={vi.fn()}
        onPaired={vi.fn()}
        deviceId="DEV-1"
        onOpenScanner={vi.fn().mockResolvedValue(null)}
      />,
    );
    expect(screen.getByTestId('lan-join-scan')).toBeInTheDocument();
  });

  it('shows the invalid-URL error when the pasted text cannot be parsed', async () => {
    const pair = vi.fn();
    renderWithProviders(<LanJoinScreen pair={pair} onPaired={vi.fn()} deviceId="DEV-1" />);
    fireEvent.change(getInput('lan-join-paste-input'), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByTestId('lan-join-paste-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('lan-join-error')).toBeInTheDocument();
    });
    expect(pair).not.toHaveBeenCalled();
  });

  it('calls pair() then onPaired() on a valid pasted URL', async () => {
    const pair = vi.fn().mockResolvedValue(STUB_PAIR_SUCCESS);
    const onPaired = vi.fn();
    renderWithProviders(<LanJoinScreen pair={pair} onPaired={onPaired} deviceId="DEV-1" />);
    fireEvent.change(getInput('lan-join-paste-input'), {
      target: { value: 'cachink-lan://192.168.1.5:43812?token=abc123' },
    });
    fireEvent.click(screen.getByTestId('lan-join-paste-submit'));
    await waitFor(() => {
      expect(pair).toHaveBeenCalledWith({
        serverUrl: 'http://192.168.1.5:43812',
        pairingToken: 'abc123',
        deviceId: 'DEV-1',
      });
    });
    await waitFor(() => {
      expect(onPaired).toHaveBeenCalledWith(STUB_PAIR_SUCCESS);
    });
  });

  it('surfaces a pair() rejection as the join error', async () => {
    const pair = vi.fn().mockRejectedValue(new Error('No autorizado'));
    const onPaired = vi.fn();
    renderWithProviders(<LanJoinScreen pair={pair} onPaired={onPaired} deviceId="DEV-1" />);
    fireEvent.change(getInput('lan-join-paste-input'), {
      target: { value: 'cachink-lan://192.168.1.5:43812?token=abc' },
    });
    fireEvent.click(screen.getByTestId('lan-join-paste-submit'));
    await waitFor(() => {
      expect(screen.getByTestId('lan-join-error').textContent).toMatch(/No autorizado/);
    });
    expect(onPaired).not.toHaveBeenCalled();
  });
});
