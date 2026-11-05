import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import { consultarSatFactura, registrarFacturas, subirFacturas } from '@xangarro/application/corp';
import type { EstadoSat } from '@xangarro/domain/corp';
import { cfdiXml, RFC_MEXIA_PRUEBA, uuidDePrueba } from '@xangarro/testing/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createPgBlobStore } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { createReceivedInvoiceRepository } from '../src/queries/facturas';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * «Consultar al SAT» over the corp schema (E-11, board CD-06g): the SAT's
 * later answer is kept on a registered invoice it did not answer for at
 * upload, and a verified one keeps its status.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-facturas-sat-test';

describe('corp received invoices asked of the SAT again', () => {
  let satDice: EstadoSat = 'sin_respuesta';
  const deps = () => {
    const db = createCorpDb(url as string);
    return {
      facturas: createReceivedInvoiceRepository(db),
      ledger: createCorpLedgerRepository(db),
      documentos: createDocumentRepository(db, createPgBlobStore(db)),
      sat: { estado: async () => satDice },
      rfcMexia: async () => RFC_MEXIA_PRUEBA,
      sha256: async () => 'c'.repeat(64),
    };
  };

  /** A registered invoice the SAT did not answer for at upload. */
  async function sinVerificar(d: ReturnType<typeof deps>) {
    const uuid = uuidDePrueba();
    const texto = cfdiXml({ uuid, fecha: '2026-10-02' });
    satDice = 'sin_respuesta';
    const contenido = new TextEncoder().encode(texto);
    await subirFacturas(d, { archivos: [{ nombre: 'f.xml', contenido, texto }], founderId: AUTOR });
    await registrarFacturas(d, {
      selecciones: [{ uuid, categoria: 'administracion', projectId: null }],
      founderId: AUTOR,
      hoy: '2026-10-29',
    });
    return uuid;
  }

  afterAll(() => borrarLoDe(AUTOR));

  it('keeps «cancelado» on a registered invoice, and then never changes it', async () => {
    const d = deps();
    const uuid = await sinVerificar(d);
    assert.equal((await d.facturas.porUuid(uuid))?.estadoSat, 'sin_verificar');
    satDice = 'cancelado';
    assert.equal(await consultarSatFactura(d, { uuid }), 'cancelado');
    const f = await d.facturas.porUuid(uuid);
    assert.deepEqual([f?.estadoSat, f?.estado], ['cancelado', 'registrada']);
    await d.facturas.marcarEstadoSat(uuid, 'vigente');
    assert.equal((await d.facturas.porUuid(uuid))?.estadoSat, 'cancelado');
  });

  it('keeps «vigente», and leaves it unverified while the SAT does not answer', async () => {
    const d = deps();
    const uuid = await sinVerificar(d);
    assert.equal(await consultarSatFactura(d, { uuid }), 'sin_respuesta');
    assert.equal((await d.facturas.porUuid(uuid))?.estadoSat, 'sin_verificar');
    satDice = 'vigente';
    assert.equal(await consultarSatFactura(d, { uuid }), 'vigente');
    assert.equal((await d.facturas.porUuid(uuid))?.estadoSat, 'vigente');
  });
});
