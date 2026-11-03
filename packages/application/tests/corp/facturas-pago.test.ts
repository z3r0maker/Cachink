import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { FechaDePagoError, registrarFacturas, registrarPagoFactura } from '../../src/corp/index.js';
import { A, conSubida, ctx, cuenta, seleccion } from './facturas-escenario.js';

/** «Registrar pago» on the day the money left the bank (E-11, board CD-06e). */
async function porPagar(fecha = '2026-10-28') {
  const d = await conSubida({ metodoPago: 'PPD', fecha });
  await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
  return d;
}

const pagar = (d: Awaited<ReturnType<typeof porPagar>>, fecha: string) =>
  registrarPagoFactura(d, { uuid: A, fecha, hoy: '2026-10-30', founderId: 'f1' });

describe('registrarPagoFactura with its date (E-11, board CD-06e)', () => {
  it('posts the payment on the day the founder chose', async () => {
    const d = await porPagar();
    const pago = await pagar(d, '2026-10-29');
    assert.equal(pago.fecha, '2026-10-29');
    assert.equal(cuenta(pago.lines, 'bancos')?.haber, 3_336_67n);
  });

  it('takes the invoice’s own day and today, the two ends', async () => {
    assert.equal((await pagar(await porPagar(), '2026-10-28')).fecha, '2026-10-28');
    assert.equal((await pagar(await porPagar(), '2026-10-30')).fecha, '2026-10-30');
  });

  it('refuses a day before the invoice', async () => {
    const d = await porPagar();
    await assert.rejects(pagar(d, '2026-10-27'), {
      code: 'FECHA_DE_PAGO_INVALIDA',
      message: 'El pago no puede ser antes de la fecha de la factura.',
    });
    assert.equal((await d.facturas.porUuid(A))?.pagoEntryId, null, 'nothing was paid');
  });

  it('refuses a day after today', async () => {
    await assert.rejects(pagar(await porPagar(), '2026-10-31'), {
      code: 'FECHA_DE_PAGO_INVALIDA',
      message: 'El pago no puede ser después de hoy.',
    });
  });

  it('refuses a closed month and names the first open one', async () => {
    const d = await porPagar('2026-07-20');
    await assert.rejects(pagar(d, '2026-08-14'), {
      message: 'Agosto ya está cerrado. Elige una fecha de septiembre en adelante.',
    });
    d.ledger.closed.add('2026-09');
    await assert.rejects(pagar(d, '2026-08-14'), {
      message: 'Agosto ya está cerrado. Elige una fecha de octubre en adelante.',
    });
  });

  it('refuses what is not a date', async () => {
    await assert.rejects(pagar(await porPagar(), ''), FechaDePagoError);
    for (const fecha of ['2026-13-01', '2026-10-32', '2026-02-30']) {
      await assert.rejects(pagar(await porPagar(), fecha), { message: 'Elige la fecha de pago.' });
    }
  });
});
