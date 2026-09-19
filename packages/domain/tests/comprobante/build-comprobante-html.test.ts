/**
 * Unit tests for buildComprobanteHtml (P1C-M3-T04).
 */

import { describe, expect, it } from 'vitest';
import type { Business, BusinessId, DeviceId, IsoDate, IsoTimestamp } from '../../src/index';
import { buildComprobanteHtml, escapeHtml } from '../../src/comprobante/index';

const business: Business = {
  id: '01JPHK00000000000000000008' as BusinessId,
  nombre: 'Taquería Don Pedro',
  regimenFiscal: 'RIF',
  isrTasa: 3000,
  logoUrl: null,
  businessId: '01JPHK00000000000000000008' as BusinessId,
  deviceId: '01JPHK00000000000000000007' as DeviceId,
  createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
  deletedAt: null,
};

function sale(overrides: { concepto?: string; metodo?: string; estadoPago?: string } = {}): Ticket {
  return {
    id: '01JPHK0000000000000000S001' as TicketId,
    folio: 405,
    fecha: '2026-04-24' as IsoDate,
    hora: '10:30',
    concepto: overrides.concepto ?? 'Taco al pastor',
    metodo: (overrides.metodo ?? 'Efectivo') as Ticket['metodo'],
    clienteId: null,
    estadoPago: (overrides.estadoPago ?? 'pagado') as Ticket['estadoPago'],
    efectivoRecibidoCentavos: null,
    cambioCentavos: null,
    cajaTurnoId: null,
    cancelMotivo: null,
    cancelledByUserId: null,
    cancelledAt: null,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdByUserId: null,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
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
    const html = buildComprobanteHtml({ ticket: sale(), total: 15000n, business });
    expect(html.startsWith('<!doctype html>')).toBe(true);
  });

  it('includes the business nombre and sale concepto', () => {
    const html = buildComprobanteHtml({ ticket: sale(), total: 15000n, business });
    expect(html).toContain('Taquería Don Pedro');
    expect(html).toContain('Taco al pastor');
  });

  it('includes the formatted money amount (es-MX)', () => {
    const html = buildComprobanteHtml({ ticket: sale({ monto: 15000n }), total: 15000n, business });
    expect(html).toContain('$150.00');
  });

  it('renders the "Pendiente de pago" badge only for Crédito sales', () => {
    const cash = buildComprobanteHtml({
      ticket: sale({ estadoPago: 'pagado' }),
      total: 15000n,
      business,
    });
    const credito = buildComprobanteHtml({
      ticket: sale({ estadoPago: 'pendiente', metodo: 'Crédito' }),
      total: 15000n,
      business,
    });
    expect(cash).not.toContain('Pendiente de pago');
    expect(credito).toContain('Pendiente de pago');
  });

  it('escapes HTML-unsafe characters in concepto', () => {
    const html = buildComprobanteHtml({
      ticket: sale({ concepto: 'Taco <script>' }),
      total: 15000n,
      business,
    });
    expect(html).toContain('Taco &lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it('honours a custom thank-you message', () => {
    const html = buildComprobanteHtml({
      ticket: sale(),
      total: 15000n,
      business,
      thankYou: '¡Nos vemos pronto!',
    });
    expect(html).toContain('¡Nos vemos pronto!');
  });

  it('honours custom labels', () => {
    const html = buildComprobanteHtml({
      ticket: sale({ estadoPago: 'pendiente', metodo: 'Crédito' }),
      total: 15000n,
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
      ticket: sale({ metodo: 'Transferencia' }),
      total: 15000n,
      business,
    });
    expect(html).toContain('Transferencia');
  });
});
