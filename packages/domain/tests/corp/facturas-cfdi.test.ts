import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { CfdiInvalidoError, leerCfdi } from '../../src/corp/facturas/index.js';
import { cfdi, comprobante, RFC_MEXIA, UUID } from './cfdi-xml.js';

const motivo = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof CfdiInvalidoError) return e.motivo;
    throw e;
  }
  throw new Error('no lanzó');
};

describe('leerCfdi (E-11)', () => {
  it('reads board CD-06d: supplier, amounts, withholdings, UUID, payment method', () => {
    const f = leerCfdi(cfdi());
    assert.equal(f.uuid, UUID);
    assert.equal(f.fecha, '2026-10-28');
    assert.equal(f.folio, 'H118');
    assert.deepEqual(f.emisor, { rfc: 'LOMA800101AB2', nombre: 'ANA LÓPEZ MARTÍNEZ' });
    assert.deepEqual(f.receptor, { rfc: RFC_MEXIA, uso: 'G03' });
    assert.equal(f.metodoPago, 'PUE');
    assert.equal(f.subtotal, 3_500_00n);
    assert.equal(f.iva, 560_00n);
    assert.equal(f.retencionIsr, 350_00n);
    assert.equal(f.retencionIva, 373_33n);
    assert.equal(f.total, 3_336_67n);
    assert.equal(f.moneda, 'MXN');
    assert.equal(f.usd, null);
    assert.equal(f.concepto, 'Honorarios contables de octubre');
    assert.deepEqual(f.sat, { total: '3336.67', sello8: '12AB34CD' });
  });

  it('reads an invoice on credit, a discount and six-decimal amounts', () => {
    const f = leerCfdi(
      cfdi({
        comprobante: comprobante({
          MetodoPago: 'PPD',
          FormaPago: '99',
          SubTotal: '4100.004',
          Descuento: '100.00',
          Total: '4640.004',
        }),
        impuestos:
          '<cfdi:Impuestos TotalImpuestosTrasladados="640.00"><cfdi:Traslados>' +
          '<cfdi:Traslado Base="4000.00" Impuesto="002" TipoFactor="Tasa" Importe="640.00"/>' +
          '</cfdi:Traslados></cfdi:Impuestos>',
      }),
    );
    assert.equal(f.metodoPago, 'PPD');
    assert.equal(f.subtotal, 4_000_00n);
    assert.equal(f.iva, 640_00n);
    assert.equal(f.total, 4_640_00n);
  });

  it('converts a USD invoice at its exchange rate, keeping the dollar total', () => {
    const f = leerCfdi(
      cfdi({
        comprobante: comprobante({
          Moneda: 'USD',
          TipoCambio: '18.50',
          SubTotal: '100.00',
          Total: '116.00',
        }),
        impuestos:
          '<cfdi:Impuestos TotalImpuestosTrasladados="16.00"><cfdi:Traslados>' +
          '<cfdi:Traslado Base="100.00" Impuesto="002" TipoFactor="Tasa" Importe="16.00"/>' +
          '</cfdi:Traslados></cfdi:Impuestos>',
      }),
    );
    assert.equal(f.subtotal, 1_850_00n);
    assert.equal(f.iva, 296_00n);
    assert.equal(f.total, 2_146_00n);
    assert.deepEqual(f.usd, { montoOriginal: 116_00n, tipoCambio: '18.50' });
  });

  it('adds a tax other than IVA (IEPS) to the cost, and reads an invoice without taxes', () => {
    const ieps = leerCfdi(
      cfdi({
        comprobante: comprobante({ SubTotal: '100.00', Total: '124.00' }),
        impuestos:
          '<cfdi:Impuestos><cfdi:Traslados>' +
          '<cfdi:Traslado Impuesto="003" TipoFactor="Tasa" Importe="8.00"/>' +
          '<cfdi:Traslado Impuesto="002" TipoFactor="Tasa" Importe="16.00"/>' +
          '</cfdi:Traslados></cfdi:Impuestos>',
      }),
    );
    assert.equal(ieps.subtotal, 108_00n);
    assert.equal(ieps.iva, 16_00n);
    const exenta = leerCfdi(
      cfdi({ comprobante: comprobante({ SubTotal: '50.00', Total: '50.00' }), impuestos: '' }),
    );
    assert.equal(exenta.iva, 0n);
    assert.equal(exenta.total, 50_00n);
  });

  it('refuses what is not a stamped CFDI 4.0 income invoice, saying why', () => {
    assert.equal(
      motivo(() => leerCfdi('%PDF-1.7')),
      'no_es_cfdi',
    );
    assert.equal(
      motivo(() => leerCfdi('<factura Total="1"/>')),
      'no_es_cfdi',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ Version: '3.3' }) }))),
      'version',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ TipoDeComprobante: 'P' }) }))),
      'complemento_pago',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ TipoDeComprobante: 'E' }) }))),
      'no_es_ingreso',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ complemento: '' }))),
      'sin_timbre',
    );
  });

  it('refuses amounts that do not add up, a currency it cannot convert, and a bad amount', () => {
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ Total: '3400.00' }) }))),
      'importes',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ Moneda: 'EUR' }) }))),
      'moneda',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ Moneda: 'USD' }) }))),
      'moneda',
    );
    assert.equal(
      motivo(() => leerCfdi(cfdi({ comprobante: comprobante({ SubTotal: '-3500.00' }) }))),
      'importes',
    );
  });
});
