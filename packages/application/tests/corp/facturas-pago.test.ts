import assert from 'node:assert/strict';

import { PeriodoCerradoError } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import {
  FechaPagoAnteriorError,
  registrarFacturas,
  registrarPagoFactura,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, seleccion } from './facturas-escenario.js';

/** An invoice on credit, registered and still owed; the XML is dated 2026-10-28. */
async function porPagar() {
  const d = await conSubida({ metodoPago: 'PPD' });
  await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
  return d;
}

const pagar = (d: Awaited<ReturnType<typeof porPagar>>, fecha: string) =>
  registrarPagoFactura(d, { uuid: A, fecha, founderId: 'f1' });

describe('«Registrar pago» on the day the money left the bank (board CD-06e)', () => {
  it('posts the payment on the founder’s date, the invoice’s own day included', async () => {
    const d = await porPagar();
    const pago = await pagar(d, '2026-10-28');
    assert.equal(pago.fecha, '2026-10-28');
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, pago.id);
  });

  it('refuses a date before the invoice, and the invoice stays owed', async () => {
    const d = await porPagar();
    await assert.rejects(pagar(d, '2026-10-27'), FechaPagoAnteriorError);
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, null);
  });

  it('refuses a date in a month already closed', async () => {
    const d = await porPagar();
    d.ledger.closed.add('2026-10');
    await assert.rejects(pagar(d, '2026-10-30'), PeriodoCerradoError);
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, null);
  });

  it('refuses a date that is not a date', async () => {
    const d = await porPagar();
    await assert.rejects(pagar(d, '2026-13-01'), PeriodoCerradoError);
    await assert.rejects(pagar(d, ''), FechaPagoAnteriorError);
  });
});
