import assert from 'node:assert/strict';
import { afterAll, it } from 'vitest';
import { cancelarFactura, registrarFacturas, subirFacturas } from '@xangarro/application/corp';
import { cfdiXml, RFC_MEXIA_PRUEBA, uuidDePrueba } from '@xangarro/testing/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createPgBlobStore } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { createReceivedInvoiceRepository } from '../src/queries/facturas';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { createRecurringTemplateRepository } from '../src/queries/recurrentes';
import { crearBaseDesechable } from './base-desechable';
import { borrarLoDe } from './cleanup';

/**
 * E-11, board CD-01f: a supplier who invoices every month. Its template keeps
 * the RFC, and a month reads as invoiced by the registered invoice of that RFC
 * dated in it, unless its expense was reversed. 0009 carries old templates.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-recurrente-factura-test';

let seq = 0;
const mesLibre = () => {
  const n = (Date.now() + seq++ * 13) % 9600;
  return `${2100 + Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
};
/** A persona moral's RFC no other run uses: three letters, a date, a homoclave. */
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const letra = () => LETRAS[Math.floor(Math.random() * LETRAS.length)] ?? 'A';
const rfcLibre = () => `R${letra()}${letra()}010101${letra()}B1`;

describe('a recurring template known by its supplier’s RFC', () => {
  const deps = () => {
    const db = createCorpDb(url as string);
    return {
      db,
      facturas: createReceivedInvoiceRepository(db),
      ledger: createCorpLedgerRepository(db),
      documentos: createDocumentRepository(db, createPgBlobStore(db)),
      plantillas: createRecurringTemplateRepository(db),
      sat: { estado: async () => 'vigente' as const },
      rfcMexia: async () => RFC_MEXIA_PRUEBA,
      sha256: async () => 'c'.repeat(64),
    };
  };

  async function registrada(d: ReturnType<typeof deps>, rfc: string, fecha: string, ppd = false) {
    const uuid = uuidDePrueba();
    const texto = cfdiXml({
      uuid,
      fecha,
      emisor: { rfc, nombre: 'Contadora E2E' },
      ...(ppd ? { metodoPago: 'PPD' } : {}),
    });
    const contenido = new TextEncoder().encode(texto);
    await subirFacturas(d, { archivos: [{ nombre: 'f.xml', contenido, texto }], founderId: AUTOR });
    const [entry] = await registrarFacturas(d, {
      selecciones: [{ uuid, categoria: 'administracion', projectId: null }],
      founderId: AUTOR,
      hoy: '2026-11-06',
    });
    return { uuid, entryId: entry?.id ?? '' };
  }

  const plantilla = (d: ReturnType<typeof deps>, rfc: string, desde: string) =>
    d.plantillas.ensure({
      id: `rec-${uuidDePrueba().toLowerCase()}`,
      nombre: 'Contadora E2E',
      contraparte: 'Contadora E2E',
      rfc,
      categoria: 'administracion',
      moneda: 'MXN',
      montoEstimado: 3_336_67n,
      diaCargo: 3,
      projectId: null,
      deducible: true,
      desde,
      createdBy: AUTOR,
    });

  afterAll(() => borrarLoDe(AUTOR));

  it('keeps the RFC, and reads a month as invoiced by that RFC’s registered invoice', async () => {
    const d = deps();
    const [mes, rfc] = [mesLibre(), rfcLibre()];
    const p = await plantilla(d, rfc, mes);
    assert.equal(p.rfc, rfc);
    assert.equal((await d.plantillas.facturadasEn(mes)).has(p.id), false);
    await registrada(d, rfcLibre(), `${mes}-02`);
    const { entryId } = await registrada(d, rfc, `${mes}-02`);
    assert.deepEqual((await d.plantillas.facturadasEn(mes)).get(p.id), {
      entryId,
      fecha: `${mes}-02`,
    });
  });

  it('does not count a reversed invoice, nor one dated in another month', async () => {
    const d = deps();
    const [mes, rfc] = [mesLibre(), rfcLibre()];
    const p = await plantilla(d, rfc, mes);
    const { uuid } = await registrada(d, rfc, `${mes}-04`, true);
    await cancelarFactura(d, { uuid, fecha: `${mes}-05`, motivo: 'Vino mal', founderId: AUTOR });
    assert.equal((await d.plantillas.facturadasEn(mes)).has(p.id), false);
    const otro = mesLibre();
    await registrada(d, rfc, `${otro}-04`);
    assert.equal((await d.plantillas.facturadasEn(mes)).has(p.id), false);
  });

  it('0009 adds the RFC to a template of the old shape, empty', async () => {
    const base = await crearBaseDesechable();
    try {
      await base.aplicar((f) => f < '0009');
      await base.sql`INSERT INTO corp.recurring_templates
        (id, nombre, categoria, moneda, monto_estimado, dia_cargo, desde, activo, created_at)
        VALUES ('rec-viejo', 'Vercel', 'costo_servicio', 'USD', 2000, 28, '2026-09', true, now())`;
      await base.aplicar((f) => f.startsWith('0009'));
      const [fila] = await base.sql<{ rfc: string | null; nombre: string }[]>`
        SELECT rfc, nombre FROM corp.recurring_templates WHERE id = 'rec-viejo'`;
      assert.deepEqual(fila, { rfc: null, nombre: 'Vercel' });
    } finally {
      await base.cerrar();
    }
  });
});
