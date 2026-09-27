import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

import { monograma } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

/**
 * Venta + branding → the renderer's contract (N-20). Every optional block is
 * passed only when the business actually set it, and a preview never fails
 * over one bad row — the branches here are refusals and fallbacks no seeded
 * tenant exercises, which is exactly why they belong to the unit suite.
 */

const reportError = vi.fn();

let business:
  | {
      id: string;
      nombre: string;
      receiptTemplate?: string | null;
      whatsapp?: string | null;
      receiptLeyenda?: string | null;
      brandColor?: string | null;
      addressPrint?: boolean | null;
      direccion?: string | null;
      socialLinks?: string | null;
    }
  | undefined;
let logo: { mime: string; bytes: Buffer } | null;
let ticket: {
  folio: string;
  fechaHora: string;
  metodo: string;
  total: bigint;
  lineas: { concepto: string; cantidad: number; importe: bigint }[];
  cancelada: boolean;
} | null;
let ultimo: typeof ticket;

vi.mock('@xangarro/data-pg', () => ({
  getBusiness: async () => business,
  logoPublico: async () => logo,
  ticketParaComprobante: async () => ticket,
  ultimoTicketComprobante: async () => ultimo,
}));
vi.mock('../src/server/observability/report', () => ({ reportError }));

const { comprobanteDeMuestra, comprobanteDeTicket, negocioParaComprobante, plantillaDelNegocio } =
  await import('../src/server/comprobante/datos');

const BASE = {
  folio: 'V-0007',
  fechaHora: '2026-05-12T10:00:00-06:00',
  metodo: 'Efectivo',
  total: 285n,
  lineas: [{ concepto: 'Orden de tacos', cantidad: 3, importe: 285n }],
  cancelada: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  business = undefined;
  logo = null;
  ticket = null;
  ultimo = null;
});

describe('plantillaDelNegocio', () => {
  it('keeps the template the business chose', async () => {
    business = { id: 'b-1', nombre: 'Taquería', receiptTemplate: 'ticket' };
    assert.equal(await plantillaDelNegocio({} as never), 'ticket');
  });

  it('a business without a row, or with an unreleased name, falls back to the ticket', async () => {
    business = undefined;
    assert.equal(await plantillaDelNegocio({} as never), 'ticket');
    business = { id: 'b-1', nombre: 'Taquería', receiptTemplate: 'pergamino' };
    assert.equal(await plantillaDelNegocio({} as never), 'ticket');
  });
});

describe('negocioParaComprobante', () => {
  it('a business that cannot be read still prints, as «Tu negocio» with the default accent', async () => {
    const n = await negocioParaComprobante({} as never);
    assert.equal(n.nombre, 'Tu negocio');
    assert.equal(n.monograma, monograma('Tu negocio'));
    assert.equal(n.acento, colors.yellow);
    assert.equal(n.logoDataUrl, undefined);
    assert.equal(n.whatsapp, undefined);
    assert.equal(n.leyenda, undefined);
    assert.equal(n.redes, undefined);
    assert.equal(n.direccion, undefined);
  });

  it('passes along only what the business set, with the logo as a data URL', async () => {
    business = {
      id: 'b-1',
      nombre: 'Taquería Don Pedro',
      whatsapp: '525510000000',
      receiptLeyenda: '¡Gracias por tu compra!',
      brandColor: '#0a7ea4',
      addressPrint: true,
      direccion: 'Av. Siempreviva 742',
      socialLinks: '{"instagram":"@donpedro"}',
    };
    logo = { mime: 'image/png', bytes: Buffer.from([1, 2, 3]) };
    const n = await negocioParaComprobante({} as never);
    assert.equal(n.whatsapp, '525510000000');
    assert.equal(n.leyenda, '¡Gracias por tu compra!');
    assert.equal(n.acento, '#0a7ea4');
    assert.equal(n.direccion, 'Av. Siempreviva 742');
    assert.equal(n.redes, '@donpedro');
    assert.equal(n.logoDataUrl, 'data:image/png;base64,AQID');
  });

  it('the address prints only when the toggle is on and a line exists (0028)', async () => {
    business = { id: 'b-1', nombre: 'T', addressPrint: true, direccion: null };
    assert.equal((await negocioParaComprobante({} as never)).direccion, undefined);
    business = { id: 'b-1', nombre: 'T', addressPrint: null, direccion: 'Calle 5' };
    assert.equal((await negocioParaComprobante({} as never)).direccion, undefined);
    business = { id: 'b-1', nombre: 'T', addressPrint: true, direccion: 'Calle 5' };
    assert.equal((await negocioParaComprobante({} as never)).direccion, 'Calle 5');
  });

  it('the social links survive being empty, blank, malformed or non-string', async () => {
    const con = async (socialLinks: string | null | undefined) => {
      business = { id: 'b-1', nombre: 'T', socialLinks };
      return (await negocioParaComprobante({} as never)).redes;
    };
    assert.equal(await con(null), undefined);
    assert.equal(await con(''), undefined);
    assert.equal(await con('{}'), undefined);
    assert.equal(await con('{"instagram":"@ok","tiktok":"no-numero"}'), '@ok');
    assert.equal(await con('{"instagram":"   "}'), undefined);
    assert.equal(await con('{"a":3}'), undefined);
    assert.equal(await con('esto no es json'), undefined);
    assert.equal(await con('{"x":"' + 'largo'.repeat(10) + '"}'), 'largo'.repeat(6));
  });
});

describe('comprobanteDeTicket', () => {
  it('a ticket that no longer exists is null, not a blank comprobante', async () => {
    ticket = null;
    assert.equal(await comprobanteDeTicket({} as never, 't-gone'), null);
  });

  it('maps the ticket to the renderer’s contract, translating the payment method', async () => {
    business = { id: 'b-1', nombre: 'Taquería' };
    ticket = { ...BASE, metodo: 'QR/CoDi', cancelada: true };
    const c = await comprobanteDeTicket({} as never, 't-1');
    assert.equal(c?.cancelada, true);
    assert.equal(c?.folio, 'V-0007');
    assert.equal(c?.metodoPago, 'Transferencia');
    assert.deepEqual(c?.conceptos, [{ concepto: 'Orden de tacos', cantidad: 3, importe: 285n }]);
  });

  it('a method the table does not know prints as Efectivo, never as undefined', async () => {
    business = { id: 'b-1', nombre: 'Taquería' };
    ticket = { ...BASE, metodo: 'Cripto' };
    assert.equal((await comprobanteDeTicket({} as never, 't-1'))?.metodoPago, 'Efectivo');
  });
});

describe('comprobanteDeMuestra', () => {
  it('previews the business’s own last ticket when it parses', async () => {
    business = { id: 'b-1', nombre: 'Taquería' };
    ultimo = { ...BASE, folio: 'V-0042' };
    assert.equal((await comprobanteDeMuestra({} as never)).folio, 'V-0042');
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a last ticket whose date will not parse falls back to the demo venta, and the row is reported', async () => {
    business = { id: 'b-1', nombre: 'Taquería' };
    ultimo = { ...BASE, folio: 'V-0042', fechaHora: 'ayer' };
    const c = await comprobanteDeMuestra({} as never);
    assert.equal(c.folio, 'V-000128');
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('a business with no ticket at all previews the demo venta silently', async () => {
    business = undefined;
    ultimo = null;
    assert.equal((await comprobanteDeMuestra({} as never)).folio, 'V-000128');
    assert.equal(reportError.mock.calls.length, 0);
  });
});
