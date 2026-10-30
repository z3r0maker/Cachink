import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  gastoDeCfdi,
  leerCfdi,
  pagoDeGasto,
  refPagoFactura,
  revisarAntesDelSat,
  revisarConSat,
} from '../../src/corp/facturas/index.js';
import { postMovement } from '../../src/corp/ledger/index.js';
import { cfdi, comprobante, RFC_MEXIA, UUID } from './cfdi-xml.js';

const HONORARIOS = leerCfdi(cfdi());

describe('revisar una factura recibida (E-11, board CD-06c)', () => {
  it('lets through an invoice to MEXIA that it does not have yet, whatever the RFC case', () => {
    assert.equal(
      revisarAntesDelSat(HONORARIOS, { rfcMexia: RFC_MEXIA.toLowerCase(), yaRegistrada: false }),
      null,
    );
  });

  it('refuses an invoice to another RFC before asking the SAT («No es de MEXIA»)', () => {
    assert.deepEqual(
      revisarAntesDelSat(HONORARIOS, { rfcMexia: 'OTR010101AA1', yaRegistrada: true }),
      { tipo: 'rechazada', motivo: 'otro_rfc' },
    );
  });

  it('refuses a UUID MEXIA already registered («Ya registrada»)', () => {
    assert.deepEqual(revisarAntesDelSat(HONORARIOS, { rfcMexia: RFC_MEXIA, yaRegistrada: true }), {
      tipo: 'rechazada',
      motivo: 'ya_registrada',
    });
  });

  it('reads the SAT: cancelled is kept aside, not found refused, no answer goes on unverified', () => {
    assert.deepEqual(revisarConSat('vigente'), { tipo: 'lista', verificada: true });
    assert.deepEqual(revisarConSat('cancelado'), { tipo: 'cancelada' });
    assert.deepEqual(revisarConSat('no_encontrado'), {
      tipo: 'rechazada',
      motivo: 'no_encontrada',
    });
    assert.deepEqual(revisarConSat('sin_respuesta'), { tipo: 'lista', verificada: false });
  });
});

describe('el gasto de una factura recibida (E-11)', () => {
  it('posts a paid invoice (PUE) like board CD-06d: the bank pays $3,336.67', () => {
    const lines = postMovement(gastoDeCfdi(HONORARIOS, 'administracion'));
    assert.equal(lines.find((l) => l.cuenta === 'bancos')?.haber, 3_336_67n);
    assert.equal(lines.find((l) => l.cuenta === 'retenciones_por_pagar')?.haber, 723_33n);
  });

  it('posts an invoice on credit (PPD) owed, and its payment from what it left owed', () => {
    const ppd = leerCfdi(cfdi({ comprobante: comprobante({ MetodoPago: 'PPD' }) }));
    const gasto = gastoDeCfdi(ppd, 'administracion');
    assert.equal(gasto.pagado, false);
    const pago = pagoDeGasto(gasto);
    assert.deepEqual(pago, {
      kind: 'pago_proveedor',
      total: 4_060_00n,
      ivaPorAcreditar: 560_00n,
      retencionIsr: 350_00n,
      retencionIva: 373_33n,
    });
    assert.equal(refPagoFactura(UUID), `${UUID}:pago`);
  });

  it('posts an invoice without IVA as exempt, and pays it without IVA', () => {
    const exenta = leerCfdi(
      cfdi({ comprobante: comprobante({ SubTotal: '50.00', Total: '50.00' }), impuestos: '' }),
    );
    const gasto = gastoDeCfdi(exenta, 'desarrollo');
    assert.equal(gasto.tratamientoIva, 'exento');
    assert.equal(pagoDeGasto({ ...gasto, pagado: false }).ivaPorAcreditar, 0n);
  });
});
