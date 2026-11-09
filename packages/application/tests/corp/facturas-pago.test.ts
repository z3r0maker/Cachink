import assert from 'node:assert/strict';

import { PeriodoCerradoError } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import {
  FechaPagoAnteriorError,
  FechaPagoFuturaError,
  FechaPagoInvalidaError,
  registrarFacturas,
  registrarPagoFactura,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, cuenta, seleccion } from './facturas-escenario.js';

/**
 * An invoice on credit, registered and still owed; the XML is dated
 * 2026-10-28 and today is 2026-11-06 in Mexico. Its payment falls between
 * the two, both days included (board CD-06e).
 */
const HOY = '2026-11-06';

async function porPagar() {
  const d = await conSubida({ metodoPago: 'PPD' });
  await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
  return d;
}

const pagar = (d: Awaited<ReturnType<typeof porPagar>>, fecha: string) =>
  registrarPagoFactura(d, { uuid: A, fecha, founderId: 'f1', hoy: HOY });

/** Refused, with the message the founder reads, and the invoice still owed. */
async function rechaza(fecha: string, error: new (...a: never[]) => Error, mensaje: string) {
  const d = await porPagar();
  await assert.rejects(pagar(d, fecha), (e: unknown) => {
    assert.ok(e instanceof error);
    assert.equal(e.message, mensaje);
    return true;
  });
  assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, null);
}

describe('«Registrar pago» on the day the money left the bank (board CD-06e)', () => {
  it('pays on the invoice’s own day: what leaves the bank is its total', async () => {
    const d = await porPagar();
    const pago = await pagar(d, '2026-10-28');
    assert.equal(pago.fecha, '2026-10-28');
    assert.equal(cuenta(pago.lines, 'bancos')?.haber, 3_336_67n);
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, pago.id);
  });

  it('pays today, the last day it may', async () => {
    const d = await porPagar();
    const pago = await pagar(d, HOY);
    assert.equal(pago.fecha, HOY);
    assert.equal(cuenta(pago.lines, 'bancos')?.haber, 3_336_67n);
  });

  it('refuses a day before the invoice', () =>
    rechaza(
      '2026-10-27',
      FechaPagoAnteriorError,
      'La fecha de pago no puede ser antes de la fecha de la factura.',
    ));

  it('refuses a day after today', () =>
    rechaza('2026-11-07', FechaPagoFuturaError, 'La fecha de pago no puede ser después de hoy.'));

  it('refuses a day the month does not have, or no date at all', async () => {
    await rechaza('2026-11-31', FechaPagoInvalidaError, 'Elige una fecha de pago válida.');
    await rechaza('', FechaPagoInvalidaError, 'Elige una fecha de pago válida.');
  });

  it('refuses a date in a month already closed', async () => {
    const d = await porPagar();
    d.ledger.closed.add('2026-10');
    await assert.rejects(pagar(d, '2026-10-30'), PeriodoCerradoError);
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, null);
  });
});
