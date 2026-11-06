import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import {
  consultarSatFactura,
  FacturaDesconocidaError,
  FacturaNoPorVerificarError,
  registrarFacturas,
} from '../../src/corp/index.js';
import { A, conSubida, ctx, seleccion } from './facturas-escenario.js';

/** A registered invoice the SAT did not answer for at upload. */
async function sinVerificar() {
  const d = await conSubida({}, 'sin_respuesta');
  await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
  return d;
}

const consultar = (d: Awaited<ReturnType<typeof sinVerificar>>, uuid = A) =>
  consultarSatFactura(d, { uuid });

describe('«Consultar al SAT» an unverified invoice again (board CD-06g)', () => {
  it('keeps «vigente» when the SAT confirms it', async () => {
    const d = await sinVerificar();
    assert.equal((await d.facturas.porUuid(A))?.estadoSat, 'sin_verificar');
    d.sat.respuestas.set(A, 'vigente');
    assert.equal(await consultar(d), 'vigente');
    assert.equal((await d.facturas.porUuid(A))?.estadoSat, 'vigente');
  });

  it('keeps «cancelado» and reverses nothing: a founder cancels it', async () => {
    const d = await sinVerificar();
    const asientos = d.ledger.entries.length;
    d.sat.respuestas.set(A, 'cancelado');
    assert.equal(await consultar(d), 'cancelado');
    const f = await d.facturas.porUuid(A);
    assert.deepEqual([f?.estadoSat, f?.estado], ['cancelado', 'registrada']);
    assert.equal(d.ledger.entries.length, asientos);
  });

  it('stays unverified when the SAT does not answer or cannot find it yet', async () => {
    const d = await sinVerificar();
    assert.equal(await consultar(d), 'sin_respuesta');
    d.sat.respuestas.set(A, 'no_encontrado');
    assert.equal(await consultar(d), 'no_encontrado');
    assert.equal((await d.facturas.porUuid(A))?.estadoSat, 'sin_verificar');
    assert.equal(d.sat.preguntas.filter((u) => u === A).length, 3);
  });

  it('refuses an invoice it does not keep', async () => {
    const d = await sinVerificar();
    await assert.rejects(
      consultar(d, 'BBBBBBBB-0000-4000-8000-000000000002'),
      FacturaDesconocidaError,
    );
  });

  it('refuses one already verified, without asking the SAT', async () => {
    const d = await conSubida();
    await registrarFacturas(d, { selecciones: [seleccion], ...ctx });
    const preguntas = d.sat.preguntas.length;
    await assert.rejects(consultar(d), FacturaNoPorVerificarError);
    assert.equal(d.sat.preguntas.length, preguntas);
  });

  it('refuses one still waiting for review: the review asks the SAT itself', async () => {
    const d = await conSubida({}, 'sin_respuesta');
    await assert.rejects(consultar(d), FacturaNoPorVerificarError);
  });
});
