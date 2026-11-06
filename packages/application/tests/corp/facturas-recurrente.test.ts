import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  FacturaDesconocidaError,
  FacturaSinRegistrarError,
  hacerRecurrenteFactura,
  registrarFacturas,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, seleccion } from './facturas-escenario.js';
import { FakePlantillas } from './fake-recurrentes.js';

/**
 * E-11, board CD-06h: «Hacer recurrente cada mes» on Registrar with an XML.
 * The template is the supplier's: its RFC, the invoice's day and month, what
 * left the bank. The XML is the contadora's honorarios, dated 2026-10-28.
 */
async function registrada() {
  const d = await conSubida();
  await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
  return { ...d, plantillas: new FakePlantillas(d.ledger) };
}

const hacer = (d: Awaited<ReturnType<typeof registrada>>, uuid = A) =>
  hacerRecurrenteFactura(d, { uuid, founderId: 'f1' });

describe('«Hacer recurrente cada mes» with an XML (board CD-06h)', () => {
  it('makes the supplier’s template from the registered invoice', async () => {
    const d = await registrada();
    const p = await hacer(d);
    assert.deepEqual(
      [p.id, p.nombre, p.rfc, p.categoria, p.moneda, p.montoEstimado, p.diaCargo, p.desde],
      [
        `rec-${A.toLowerCase()}`,
        'ANA LÓPEZ MARTÍNEZ',
        'LOMA800101AB2',
        'administracion',
        'MXN',
        3_336_67n,
        28,
        '2026-10',
      ],
    );
  });

  it('makes it once: again, or for a supplier already repeating, it is the same template', async () => {
    const d = await registrada();
    const p = await hacer(d);
    assert.equal((await hacer(d)).id, p.id);
    // The same supplier, repeating from an earlier invoice.
    d.plantillas.plantillas.splice(0, 1, { ...p, id: 'rec-anterior' });
    assert.equal((await hacer(d)).id, 'rec-anterior');
    assert.equal(d.plantillas.plantillas.length, 1);
  });

  it('refuses an invoice it does not keep', async () => {
    const d = await registrada();
    await assert.rejects(hacer(d, 'BBBBBBBB-0000-4000-8000-000000000002'), FacturaDesconocidaError);
  });

  it('refuses one not registered yet, and makes nothing', async () => {
    const subida = await conSubida();
    const d = { ...subida, plantillas: new FakePlantillas(subida.ledger) };
    await assert.rejects(hacer(d), FacturaSinRegistrarError);
    assert.equal(d.plantillas.plantillas.length, 0);
  });
});
