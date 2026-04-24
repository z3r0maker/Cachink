/**
 * Unit tests for buildComprobanteHtml (P1C-M3-T04).
 */

import { describe, expect, it } from 'vitest';
import type {
  Business,
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Sale,
  SaleId,
} from '../../src/index';
import { buildComprobanteHtml, escapeHtml } from '../../src/comprobante/index';

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

function sale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: '01JPHK0000000000000000S001' as SaleId,
    fecha: '2026-04-24' as IsoDate,
    concepto: 'Taco al pastor',
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
    ...overrides,
  };
}

describe('escapeHtml', () => {
  it('escapes the five HTML-unsafe characters', () => {
    expect(escapeHtml('<script>&"\'')).toBe('&lt;script&gt;&amp;&quot;&#39;');
  });

  it('returns the string unchanged when no unsafe characters are present', () => {
    expect(escapeHtml('Taquería Don Pedro')).toBe('Taquería Don Pedro');
  });
});

describe('buildComprobanteHtml', () => {
  it('renders a full HTML document starting with <!doctype html>', () => {
    const html = buildComprobanteHtml({ sale: sale(), business });
    expect(html.startsWith('<!doctype html>')).toBe(true);
  });

  it('includes the business nombre and sale concepto', () => {
    const html = buildComprobanteHtml({ sale: sale(), business });
    expect(html).toContain('Taquería Don Pedro');
    expect(html).toContain('Taco al pastor');
  });

  it('includes the formatted money amount (es-MX)', () => {
    const html = buildComprobanteHtml({ sale: sale({ monto: 15000n }), business });
    expect(html).toContain('$150.00');
  });

  it('renders the "Pendiente de pago" badge only for Crédito sales', () => {
    const cash = buildComprobanteHtml({ sale: sale({ estadoPago: 'pagado' }), business });
    const credito = buildComprobanteHtml({
      sale: sale({ estadoPago: 'pendiente', metodo: 'Crédito' }),
      business,
    });
    expect(cash).not.toContain('Pendiente de pago');
    expect(credito).toContain('Pendiente de pago');
  });

  it('escapes HTML-unsafe characters in concepto', () => {
    const html = buildComprobanteHtml({
      sale: sale({ concepto: 'Taco <script>' }),
      business,
    });
    expect(html).toContain('Taco &lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('honours a custom thank-you message', () => {
    const html = buildComprobanteHtml({
      sale: sale(),
      business,
      thankYou: '¡Nos vemos pronto!',
    });
    expect(html).toContain('¡Nos vemos pronto!');
  });

  it('honours custom labels', () => {
    const html = buildComprobanteHtml({
      sale: sale({ estadoPago: 'pendiente', metodo: 'Crédito' }),
      business,
      labels: {
        comprobante: 'Receipt',
        fecha: 'Date',
        metodo: 'Method',
        credito: 'Owed',
      },
    });
    expect(html).toContain('Date');
    expect(html).toContain('Method');
    expect(html).toContain('Owed');
  });

  it('renders the metodo in the method row', () => {
    const html = buildComprobanteHtml({
      sale: sale({ metodo: 'Transferencia' }),
      business,
    });
    expect(html).toContain('Transferencia');
  });
});
