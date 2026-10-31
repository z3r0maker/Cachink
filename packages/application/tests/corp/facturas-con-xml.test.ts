import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PeriodoCerradoError } from '@xangarro/domain/corp';

import {
  FacturaDesconocidaError,
  FacturaNoPendienteError,
  quitarFactura,
  registrarFacturas,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, seleccion } from './facturas-escenario.js';

/**
 * Board CD-06d: one XML attached from Registrar gasto. The founder may
 * reword the concept and, for a paid invoice, say the day it left the bank;
 * «Quitar» sets the XML aside.
 */
describe('registering one XML from Registrar gasto (E-11, CD-06d)', () => {
  it('takes the founder’s concept and payment date for a paid (PUE) invoice', async () => {
    const d = await conSubida();
    const [entry] = await registrarFacturas(d, {
      selecciones: [
        { ...seleccion, concepto: '  Honorarios contables de octubre ', fecha: '2026-10-30' },
      ],
      ...ctx,
    });
    assert.deepEqual(
      [entry?.fecha, entry?.concepto, entry?.sourceRef],
      ['2026-10-30', 'Honorarios contables de octubre', A],
    );
  });

  it('keeps the XML’s concept when the field comes back blank', async () => {
    const d = await conSubida({ concepto: 'Servicios contables' });
    const [entry] = await registrarFacturas(d, {
      selecciones: [{ ...seleccion, concepto: '   ' }],
      ...ctx,
    });
    assert.equal(entry?.concepto, 'Servicios contables');
  });

  it('dates an invoice on credit (PPD) on the invoice: nothing has been paid yet', async () => {
    const d = await conSubida({ metodoPago: 'PPD' });
    const [entry] = await registrarFacturas(d, {
      selecciones: [{ ...seleccion, fecha: '2026-11-05' }],
      ...ctx,
    });
    assert.equal(entry?.fecha, '2026-10-28');
  });

  it('refuses a payment date in a closed month', async () => {
    const d = await conSubida();
    await assert.rejects(
      registrarFacturas(d, { selecciones: [{ ...seleccion, fecha: '2026-08-20' }], ...ctx }),
      PeriodoCerradoError,
    );
    assert.equal((await d.facturas.porUuid(A))?.estado, 'por_revisar');
  });
});

describe('quitarFactura (E-11, CD-06d «Quitar»)', () => {
  it('sets the waiting XML aside; uploading it again takes it back', async () => {
    const d = await conSubida();
    await quitarFactura(d.facturas, A);
    assert.equal((await d.facturas.porUuid(A))?.estado, 'descartada');
    assert.deepEqual(await d.facturas.porRevisar(), []);
  });

  it('refuses an unknown UUID', async () => {
    const d = await conSubida();
    await assert.rejects(quitarFactura(d.facturas, 'NOPE'), FacturaDesconocidaError);
  });

  it('refuses an invoice already registered: its movement is reversed, not removed', async () => {
    const d = await conSubida();
    await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    await assert.rejects(quitarFactura(d.facturas, A), FacturaNoPendienteError);
    assert.equal((await d.facturas.porUuid(A))?.estado, 'registrada');
  });

  it('refuses one the SAT reports cancelled', async () => {
    const d = await conSubida();
    await d.facturas.marcarCancelada(A);
    await assert.rejects(quitarFactura(d.facturas, A), FacturaNoPendienteError);
  });
});
