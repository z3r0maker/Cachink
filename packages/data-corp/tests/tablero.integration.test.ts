import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, it } from 'vitest';
import {
  actualizarAvance,
  crearObjetivo,
  crearTarjeta,
  enviarPlan,
  guardarClausula,
  marcarAvisoEnviado,
  moverTarjeta,
  proponerValor,
  responderPlan,
  subirDocumento,
  usarCotizacion,
  type TableroDeps,
} from '@xangarro/application/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb, type CorpDb } from '../src/client';
import { createPgBlobStore } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { createTableroRepository } from '../src/queries/tablero';
import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * The Tablero (E-20) against rows the seed does not have, in a database of
 * its own (its plans are the company's), as `xangarro_corp`: the 4T 2026 plan
 * sent and approved, a card valued by quote, a card finished and objected, an
 * objective's progress, the clause, and the notice. Then the triggers on their
 * own, past the use cases.
 */
const { url, describe } = integrationSuite();
const F1 = 'f-tablero-1';
const F2 = 'f-tablero-2';

describe('corp tablero', () => {
  let base: BaseDesechable;
  let db: CorpDb;
  let deps: TableroDeps;
  let docs: ReturnType<typeof createDocumentRepository>;
  let tarjeta: string;
  let cotizada: string;

  const archivar = (titulo: string) => async () =>
    (
      await subirDocumento(
        {
          documentos: docs,
          ledger: createCorpLedgerRepository(db),
          sha256: async (b) => createHash('sha256').update(b).digest('hex'),
        },
        {
          carpeta: 'acuerdo_socios',
          titulo,
          periodo: '2026',
          entryId: null,
          tipo: 'otro',
          archivo: {
            nombre: `${titulo}.pdf`,
            mime: 'application/pdf',
            contenido: new TextEncoder().encode('%PDF'),
          },
          hoy: '2026-10-02',
          founderId: F1,
        },
      )
    ).id;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    await base.aplicar(() => true);
    const u = new URL(url as string);
    u.pathname = `/${base.nombre}`;
    db = createCorpDb(u.toString(), 1);
    deps = { tablero: createTableroRepository(db) };
    docs = createDocumentRepository(db, createPgBlobStore(db));
    const card = {
      tipo: 'entregable' as const,
      objetivoId: null,
      hoy: '2026-10-01',
      trimestre: '2026-T4',
      vence: '2026-12-15',
    };
    tarjeta = await crearTarjeta(deps, {
      ...card,
      titulo: 'Lanzamiento público',
      criterio: 'En App Store y en la web, con cobro activo.',
      responsable: 1,
      valor: 40_000_00n,
      socio: 1,
      founderId: F1,
    });
    cotizada = await crearTarjeta(deps, {
      ...card,
      titulo: 'Alianza con una distribuidora',
      criterio: 'Convenio firmado.',
      responsable: 2,
      valor: 40_000_00n,
      socio: 2,
      founderId: F2,
    });
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
    await base?.cerrar();
  });

  it('values, the quote, and the plan sent and approved, read back as written', async () => {
    await proponerValor(deps, {
      tarjetaId: tarjeta,
      socio: 2,
      valor: 30_000_00n,
      hoy: '2026-10-01',
      founderId: F2,
    });
    await proponerValor(deps, {
      tarjetaId: cotizada,
      socio: 1,
      valor: 10_000_00n,
      hoy: '2026-10-01',
      founderId: F1,
    });
    await usarCotizacion(deps, {
      tarjetaId: cotizada,
      monto: 30_000_00n,
      hoy: '2026-10-02',
      founderId: F1,
      adjunto: archivar('Cotización de la alianza'),
    });
    await enviarPlan(deps, { trimestre: '2026-T4', socio: 1, hoy: '2026-10-02', founderId: F1 });
    await responderPlan(deps, {
      trimestre: '2026-T4',
      socio: 2,
      aprobar: true,
      hoy: '2026-10-03',
      founderId: F2,
    });
    const datos = await deps.tablero.leer();
    const [a, b] = datos.tarjetas;
    assert.deepEqual(a?.valores, { 1: 40_000_00n, 2: 30_000_00n });
    assert.equal(b?.cotizacion, 30_000_00n);
    assert.ok(b?.cotizacionDocId);
    assert.deepEqual(
      datos.planes.map((p) => [p.tipo, p.socio, p.fecha]),
      [
        ['enviado', 1, '2026-10-02'],
        ['aprobado', 2, '2026-10-03'],
      ],
    );
  });

  it("a card's events come back in order, with their evidence and reason", async () => {
    await moverTarjeta(deps, {
      tarjetaId: tarjeta,
      accion: 'terminar',
      socio: 1,
      hoy: '2026-11-12',
      enlace: 'https://xangarro.mx',
      motivo: null,
      aceptada: null,
      founderId: F1,
      adjunto: null,
    });
    await moverTarjeta(deps, {
      tarjetaId: tarjeta,
      accion: 'objetar',
      socio: 2,
      hoy: '2026-11-14',
      enlace: null,
      motivo: 'Falta el cobro en la web.',
      aceptada: null,
      founderId: F2,
      adjunto: null,
    });
    const t = (await deps.tablero.leer()).tarjetas.find((x) => x.id === tarjeta);
    assert.deepEqual(
      t?.eventos.map((e) => [e.tipo, e.socio, e.fecha, e.enlace, e.motivo]),
      [
        ['terminada', 1, '2026-11-12', 'https://xangarro.mx', null],
        ['objetada', 2, '2026-11-14', null, 'Falta el cobro en la web.'],
      ],
    );
  });

  it('objectives keep their progress; the newest clause is in force; a notice is filed once', async () => {
    const o = await crearObjetivo(deps, {
      trimestre: '2026-T4',
      quien: null,
      titulo: 'Cerrar cada mes antes del día 20',
      meta: 3,
      unidad: 'meses',
      hoy: '2026-10-02',
      founderId: F1,
    });
    await actualizarAvance(deps, {
      objetivoId: o,
      valor: 1,
      socio: 1,
      hoy: '2026-11-06',
      founderId: F1,
    });
    await guardarClausula(deps, { numero: 'Décima', texto: 'Primera versión.', founderId: F1 });
    await guardarClausula(deps, {
      numero: 'Décima segunda',
      texto: 'El socio que no cumpla…',
      founderId: F1,
    });
    const datos = await deps.tablero.leer();
    assert.deepEqual(datos.objetivos[0]?.avances, [{ valor: 1, fecha: '2026-11-06', socio: 1 }]);
    assert.equal(datos.objetivos[0]?.quien, null);
    assert.equal(datos.clausula?.numero, 'Décima segunda');
    // F1's card was objected and never fixed, F2's was never finished: both short, no notice.
    await assert.rejects(
      marcarAvisoEnviado(deps, {
        trimestre: '2026-T4',
        socio: 1,
        enviadoEl: '2027-01-09',
        hoy: '2027-01-09',
        founderId: F1,
        archivar: async () => 'x',
      }),
      /no hay aviso/,
    );
  });

  it('the database refuses what the use cases refuse', async () => {
    await assert.rejects(
      base.sql`UPDATE corp.board_cards SET value_f1 = 1 WHERE id = ${tarjeta}`,
      /value frozen/,
    );
    await assert.rejects(
      base.sql`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, founder_id, at)
               VALUES ('e-x', ${cotizada}, 'aceptada', 2, '2026-11-20', ${F2}, now())`,
      /reviewed by the other partner/,
    );
    await assert.rejects(
      base.sql`INSERT INTO corp.board_plan_events (id, quarter, kind, socio, on_date, founder_id, at)
               VALUES ('p-x', '2026-T4', 'enviado', 1, '2026-10-04', ${F1}, now())`,
      /is not a draft/,
    );
    await assert.rejects(
      base.sql`INSERT INTO corp.board_plan_events (id, quarter, kind, socio, on_date, founder_id, at)
               VALUES ('p-y', '2027-T1', 'aprobado', 2, '2026-12-20', ${F2}, now())`,
      /other partner's to answer/,
    );
    await assert.rejects(
      base.sql`INSERT INTO corp.board_card_events (id, card_id, kind, socio, on_date, founder_id, at)
               VALUES ('e-y', ${tarjeta}, 'terminada', 1, '2026-11-20', ${F1}, now())`,
      /board_card_events_evidence_check/,
    );
  });
});
