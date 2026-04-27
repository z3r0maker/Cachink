/**
 * ComprobantePreview tests (P1C-M3-T04 part 1/2).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  Business,
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Sale,
  SaleId,
} from '@cachink/domain';
import { ComprobantePreview } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const business: Business = {
  id: '01JPHK00000000000000000008' as BusinessId,
  nombre: 'Taquería Don Pedro',
  regimenFiscal: 'RIF',
  isrTasa: 0.3,
  logoUrl: null,
  businessId: '01JPHK00000000000000000008' as BusinessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

const sale: Sale = {
  id: '01JPHK0000000000000000S001' as SaleId,
  fecha: '2026-04-24' as IsoDate,
  concepto: 'Taco',
  categoria: 'Producto',
  monto: 15000n,
  metodo: 'Efectivo',
  clienteId: null,
  estadoPago: 'pagado',
  businessId: '01JPHK00000000000000000008' as BusinessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

describe('ComprobantePreview', () => {
  it('renders the preview frame when open with valid data', () => {
    renderWithProviders(
      <ComprobantePreview
        open
        onClose={vi.fn()}
        sale={sale}
        business={business}
        onShare={vi.fn()}
      />,
    );
    expect(screen.getByTestId('comprobante-preview-frame')).toBeInTheDocument();
  });

  it('calls onShare with the generated HTML when Compartir is tapped', () => {
    const onShare = vi.fn();
    renderWithProviders(
      <ComprobantePreview
        open
        onClose={vi.fn()}
        sale={sale}
        business={business}
        onShare={onShare}
      />,
    );
    const btn = screen.getAllByTestId('comprobante-share')[0]!;
    fireEvent.click(btn);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onShare.mock.calls[0]?.[0]).toContain('<!doctype html>');
  });

  it('calls onClose when the Cerrar button is tapped', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ComprobantePreview
        open
        onClose={onClose}
        sale={sale}
        business={business}
        onShare={vi.fn()}
      />,
    );
    const btn = screen.getAllByTestId('comprobante-close')[0]!;
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalled();
  });

  // Audit M-1 PR 3 fix (audit 2.16): the preview frame on web/Tauri now
  // mounts a sandboxed `<iframe srcDoc>` that renders the receipt 1:1.
  // The previous implementation displayed raw HTML source as
  // monospace text — so this assertion would have failed against the
  // pre-PR 3 frame (no iframe in the tree).
  it('renders an iframe with the comprobante HTML on the web variant', () => {
    renderWithProviders(
      <ComprobantePreview
        open
        onClose={vi.fn()}
        sale={sale}
        business={business}
        onShare={vi.fn()}
      />,
    );
    const iframe = screen.getByTestId('comprobante-preview-iframe') as HTMLIFrameElement;
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin');
    // srcDoc is set to the generated HTML string — assert the
    // wrapper handed it through verbatim.
    expect(iframe.srcdoc).toContain('<!doctype html>');
  });
});
