import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PeriodoCerradoError } from '@xangarro/domain/corp';

import {
  cancelarFactura,
  FacturaDesconocidaError,
  FacturaNoPendienteError,
  FacturaNoPorPagarError,
  registrarFacturas,
  registrarPagoFactura,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, cuenta, seleccion } from './facturas-escenario.js';

/** E-11 and owner decision 9: registering, paying and cancelling received invoices. */
describe('registrarFacturas (E-11)', () => {
  it('posts a paid invoice from its XML and files the XML next to the movement', async () => {
    const d = await conSubida();
    const [entry] = await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    assert.ok(entry);
    assert.deepEqual(
      [entry.source, entry.sourceRef, entry.fecha, entry.contraparte],
      ['cfdi', A, '2026-10-28', 'ANA LÓPEZ MARTÍNEZ'],
    );
    assert.equal(cuenta(entry.lines, 'bancos')?.haber, 3_336_67n);
    assert.equal(cuenta(entry.lines, 'retenciones_por_pagar')?.haber, 723_33n);
    const f = await d.facturas.porUuid(A);
    assert.deepEqual(
      [f?.estado, f?.entryId, f?.categoria],
      ['registrada', entry.id, 'administracion'],
    );
    assert.deepEqual(await d.facturas.recordadaPara('LOMA800101AB2'), {
      categoria: 'administracion',
      projectId: null,
    });
    const doc = d.documentos.docs[0];
    assert.deepEqual(
      [doc?.carpeta, doc?.entryId, doc?.mime],
      ['comprobantes', entry.id, 'application/xml'],
    );
  });

  it('is a no-op the second time: same entry, nothing posted twice', async () => {
    const d = await conSubida();
    const [primera] = await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    const [segunda] = await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    assert.equal(segunda?.id, primera?.id);
    assert.equal(d.ledger.entries.length, 1);
  });

  it('refuses an unknown UUID, a cancelled invoice, and a closed month', async () => {
    const d = await conSubida();
    await assert.rejects(
      registrarFacturas(d, { selecciones: [{ ...seleccion, uuid: 'NOPE' }], ...ctx }),
      FacturaDesconocidaError,
    );
    await d.facturas.marcarCancelada(A);
    await assert.rejects(
      registrarFacturas(d, { selecciones: [seleccion], ...ctx }),
      FacturaNoPendienteError,
    );
    const cerrado = await conSubida({ fecha: '2026-08-14' });
    await assert.rejects(
      registrarFacturas(cerrado, { selecciones: [seleccion], ...ctx }),
      PeriodoCerradoError,
    );
  });
});

describe('an invoice on credit (E-11, owner decision 9)', () => {
  it('posts owed, then «Registrar pago» pays the net and makes its IVA creditable', async () => {
    const d = await conSubida({ metodoPago: 'PPD' });
    const [gasto] = await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    assert.equal(cuenta(gasto?.lines ?? [], 'proveedores')?.haber, 4_060_00n);
    assert.equal(cuenta(gasto?.lines ?? [], 'iva_acreditable'), undefined);
    const pago = await registrarPagoFactura(d, { uuid: A, fecha: '2026-11-20', founderId: 'f1' });
    assert.equal(pago.sourceRef, `${A}:pago`);
    assert.equal(pago.fecha, '2026-11-20');
    assert.equal(cuenta(pago.lines, 'bancos')?.haber, 3_336_67n);
    assert.equal(cuenta(pago.lines, 'iva_acreditable')?.debe, 560_00n);
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, pago.id);
    await assert.rejects(
      registrarPagoFactura(d, { uuid: A, fecha: '2026-11-21', founderId: 'f1' }),
      FacturaNoPorPagarError,
    );
  });

  it('«Cancelar» reverses its expense and leaves it cancelled, not payable', async () => {
    const d = await conSubida({ metodoPago: 'PPD' });
    const [gasto] = await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    const reversa = await cancelarFactura(d, {
      uuid: A,
      fecha: '2026-10-30',
      motivo: 'El proveedor la canceló',
      founderId: 'f1',
    });
    assert.equal(reversa.reversesEntryId, gasto?.id);
    assert.equal((await d.facturas.porUuid(A))?.estado, 'cancelada');
    await assert.rejects(
      registrarPagoFactura(d, { uuid: A, fecha: '2026-11-20', founderId: 'f1' }),
      FacturaNoPorPagarError,
    );
  });

  it('refuses to pay or cancel a paid (PUE) invoice, or one not registered yet', async () => {
    const pue = await conSubida();
    await assert.rejects(
      registrarPagoFactura(pue, { uuid: A, fecha: '2026-11-20', founderId: 'f1' }),
      FacturaNoPorPagarError,
    );
    await registrarFacturas(pue, { selecciones: [seleccion], ...ctx });
    await assert.rejects(
      cancelarFactura(pue, { uuid: A, fecha: '2026-10-30', motivo: 'x', founderId: 'f1' }),
      FacturaNoPorPagarError,
    );
  });
});
