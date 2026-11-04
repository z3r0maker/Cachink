import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import {
  cancelarFactura,
  descartarRevision,
  registrarFacturas,
  registrarPagoFactura,
  subirFacturas,
} from '@xangarro/application/corp';
import { cfdiXml, RFC_MEXIA_PRUEBA, uuidDePrueba, type CfdiDePrueba } from '@xangarro/testing/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { documentosDelMovimiento } from '../src/queries/documentos';
import { createPgBlobStore } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { createReceivedInvoiceRepository, facturasDelMes } from '../src/queries/facturas';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { crearBaseDesechable } from './base-desechable';
import { borrarLoDe } from './cleanup';

/**
 * E-11's received invoices in the corp schema: an upload waits for review, is
 * registered with its XML filed next to its expense, an invoice on credit is
 * paid, and the guards of 0006 hold what the grants cannot.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-facturas-test';

let seq = 0;
/** A month no other run uses, so the month's list is this test's alone. */
const mesLibre = () => {
  const n = (Date.now() + seq++ * 7) % 9600;
  return `${2100 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};

const archivo = (o: CfdiDePrueba) => {
  const texto = cfdiXml(o);
  return { nombre: 'factura.xml', texto, contenido: new TextEncoder().encode(texto) };
};

describe('corp received invoices', () => {
  let corp: postgres.Sql;
  let owner: postgres.Sql;
  const deps = () => {
    const db = createCorpDb(url as string);
    return {
      db,
      facturas: createReceivedInvoiceRepository(db),
      ledger: createCorpLedgerRepository(db),
      documentos: createDocumentRepository(db, createPgBlobStore(db)),
      sat: { estado: async () => 'vigente' as const },
      rfcMexia: async () => RFC_MEXIA_PRUEBA,
      sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
    };
  };
  const subir = async (d: ReturnType<typeof deps>, o: CfdiDePrueba) =>
    subirFacturas(d, { archivos: [archivo(o)], founderId: AUTOR });

  beforeAll(() => {
    corp = postgres(url as string, { max: 1, onnotice: () => {} });
    owner = postgres(process.env.DATABASE_SUPER_URL ?? '', { max: 1, onnotice: () => {} });
  });
  afterAll(async () => {
    await Promise.all([corp.end(), owner.end()]);
    await borrarLoDe(AUTOR);
  });

  it('registers an invoice on credit, files its XML, remembers its category, then pays it', async () => {
    const d = deps();
    const mes = mesLibre();
    const uuid = uuidDePrueba();
    const emisor = { rfc: `PPD${mes.replace('-', '').slice(2)}AB1`, nombre: 'Despacho, S.C.' };
    assert.deepEqual(
      (await subir(d, { uuid, emisor, fecha: `${mes}-28`, metodoPago: 'PPD' })).listas,
      [uuid],
    );
    const [gasto] = await registrarFacturas(d, {
      selecciones: [{ uuid, categoria: 'administracion', projectId: 'xangarro' }],
      founderId: AUTOR,
      hoy: '2026-10-29',
    });
    assert.ok(gasto);
    assert.equal(gasto.lines.find((l) => l.cuenta === 'iva_por_acreditar')?.debe, 560_00n);
    const [doc] = await documentosDelMovimiento(d.db, gasto.id);
    assert.equal(doc?.mime, 'application/xml');
    assert.deepEqual(await d.facturas.recordadaPara(emisor.rfc), {
      categoria: 'administracion',
      projectId: 'xangarro',
    });
    const pago = await registrarPagoFactura(d, { uuid, fecha: `${mes}-28`, founderId: AUTOR });
    const [delMes] = await facturasDelMes(d.db, mes);
    assert.deepEqual(
      [delMes?.factura.cfdi.uuid, delMes?.factura.pagoEntryId, delMes?.revertida],
      [uuid, pago.id, false],
    );
    assert.deepEqual([delMes?.pagadaEl, delMes?.revertidaEl], [`${mes}-28`, null]);
    assert.equal(delMes?.factura.cfdi.total, 3_336_67n);
  });

  it('lists a cancelled invoice on credit with the day its expense was reversed', async () => {
    const d = deps();
    const mes = mesLibre();
    const uuid = uuidDePrueba();
    await subir(d, { uuid, fecha: `${mes}-02`, metodoPago: 'PPD' });
    await registrarFacturas(d, {
      selecciones: [{ uuid, categoria: 'administracion', projectId: null }],
      founderId: AUTOR,
      hoy: '2026-10-29',
    });
    await cancelarFactura(d, { uuid, fecha: `${mes}-09`, motivo: 'Vino mal', founderId: AUTOR });
    const [delMes] = await facturasDelMes(d.db, mes);
    assert.deepEqual(
      [delMes?.factura.estado, delMes?.revertida, delMes?.pagadaEl, delMes?.revertidaEl],
      ['cancelada', true, null, `${mes}-09`],
    );
  });

  it('takes a discarded upload again, and never lists one waiting or discarded', async () => {
    const d = deps();
    const mes = mesLibre();
    const uuid = uuidDePrueba();
    await subir(d, { uuid, fecha: `${mes}-02` });
    await descartarRevision(d.facturas);
    assert.equal((await d.facturas.porUuid(uuid))?.estado, 'descartada');
    assert.deepEqual(await facturasDelMes(d.db, mes), []);
    assert.deepEqual((await subir(d, { uuid, fecha: `${mes}-02` })).listas, [uuid]);
    assert.equal((await d.facturas.porUuid(uuid))?.estado, 'por_revisar');
  });

  it('never lets the console delete one, change what its XML says, or move it back', async () => {
    const d = deps();
    const uuid = uuidDePrueba();
    await subir(d, { uuid, fecha: `${mesLibre()}-03` });
    await assert.rejects(
      corp`DELETE FROM corp.received_invoices WHERE uuid = ${uuid}`,
      /permission denied/,
    );
    await assert.rejects(
      corp`UPDATE corp.received_invoices SET total = total + 1, subtotal = subtotal + 1 WHERE uuid = ${uuid}`,
      /what its XML says never changes/,
    );
    await assert.rejects(
      corp`UPDATE corp.received_invoices SET estado = 'cancelada' WHERE uuid = ${uuid}`,
      /por_revisar cannot become cancelada/,
    );
    await assert.rejects(
      corp`UPDATE corp.received_invoices SET estado = 'registrada' WHERE uuid = ${uuid}`,
      /received_invoices_registrada_check/,
    );
  });

  it('0006 applies over a schema that already has entries', async () => {
    // A throwaway database: dropping the table here would lock `entries` for every other file.
    const base = await crearBaseDesechable();
    try {
      await base.aplicar((f) => f < '0006');
      await base.sql.begin(async (tx) => {
        await tx`INSERT INTO corp.entries (id, fecha, kind, concepto, source, payload, created_by, created_at)
                 VALUES ('e-viejo', '2026-09-30', 'comision_bancaria', 'Comisión', 'manual', '{}', ${AUTOR}, now())`;
        await tx`INSERT INTO corp.entry_lines (id, entry_id, cuenta, debe, haber) VALUES
                   ('l1', 'e-viejo', 'financiero', 1250, 0), ('l2', 'e-viejo', 'bancos', 0, 1250)`;
      });
      await base.aplicar((f) => f.startsWith('0006'));
      const [entradas] = await base.sql<
        { n: string }[]
      >`SELECT count(*)::text AS n FROM corp.entries`;
      const [facturas] = await base.sql<
        { n: string }[]
      >`SELECT count(*)::text AS n FROM corp.received_invoices`;
      assert.deepEqual([entradas?.n, facturas?.n], ['1', '0']);
    } finally {
      await base.cerrar();
    }
  });
});
