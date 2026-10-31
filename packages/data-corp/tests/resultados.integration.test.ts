import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterAll, it } from 'vitest';
import {
  cancelarFactura,
  RegistrarMovimientoUseCase,
  registrarFacturas,
  registrarPagoFactura,
  RevertirMovimientoUseCase,
  subirFacturas,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import {
  CUENTAS_RESULTADOS,
  estadoDeResultados,
  parsePeriodo,
  type Movement,
} from '@xangarro/domain/corp';
import { cfdiXml, RFC_MEXIA_PRUEBA, uuidDePrueba } from '@xangarro/testing/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createPgBlobStore } from '../src/queries/blobs';
import { createDocumentRepository } from '../src/queries/documentos';
import { createReceivedInvoiceRepository } from '../src/queries/facturas';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { importesDeResultados } from '../src/queries/resultados';
import { borrarLoDe } from './cleanup';

/**
 * Resultados' read (E-12) against rows the seed does not have: a cash expense,
 * an invoice on credit paid the next month, one cancelled unpaid, and a
 * reversed charge. Devengado counts on the invoice date, flujo on the payment.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-resultados-test';

/** A month and the next one that no other run writes, years past every other suite's. */
const meses = () => {
  const n = (Date.now() % 9_000) + 1;
  const anio = 3000 + Math.floor(n / 12);
  const m = (n % 12) + 1;
  const sig = m === 12 ? `${anio + 1}-01` : `${anio}-${String(m + 1).padStart(2, '0')}`;
  return [`${anio}-${String(m).padStart(2, '0')}`, sig] as const;
};

const movimiento = (fecha: string, movement: Movement): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `E2E resultados ${movement.kind}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement,
});

const gasto = (subtotal: bigint): Movement => ({
  kind: 'gasto',
  categoria: 'administracion',
  subtotal,
  iva: 0n,
  tratamientoIva: 'exento',
  retencionIsr: 0n,
  retencionIva: 0n,
  pagado: true,
});

describe('corp resultados read', () => {
  afterAll(() => borrarLoDe(AUTOR));

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

  async function facturaACredito(d: ReturnType<typeof deps>, fecha: string) {
    const uuid = uuidDePrueba();
    const texto = cfdiXml({ uuid, fecha, metodoPago: 'PPD' });
    const archivo = { nombre: 'f.xml', texto, contenido: new TextEncoder().encode(texto) };
    const registrar = async () => {
      await subirFacturas(d, { archivos: [archivo], founderId: AUTOR });
      return registrarFacturas(d, {
        selecciones: [{ uuid, categoria: 'desarrollo', projectId: 'xangarro' }],
        founderId: AUTOR,
        hoy: fecha,
      });
    };
    // Leaving the review discards every waiting upload (E-11), and the facturas suite does
    // that in parallel; a discarded upload is taken again by uploading it once more.
    const [entry] = await registrar().catch(registrar);
    assert.ok(entry);
    return { uuid, entry };
  }

  it('dates an invoice on credit by its payment in flujo, and a cancelled one never', async () => {
    const d = deps();
    const [mes, sig] = meses();
    const registrar = new RegistrarMovimientoUseCase(d.ledger);
    const cobro = await registrar.execute(
      movimiento(`${mes}-05`, {
        kind: 'cobro',
        subtotal: 10_000_00n,
        iva: 1_600_00n,
        destino: 'bancos',
      }),
    );
    const efectivo = await registrar.execute(movimiento(`${mes}-06`, gasto(1_000_00n)));
    const errado = await registrar.execute(movimiento(`${mes}-07`, gasto(250_00n)));
    const reversa = await new RevertirMovimientoUseCase(d.ledger).execute({
      entryId: errado.id,
      fecha: `${mes}-08`,
      motivo: 'Cargo duplicado',
      founderId: AUTOR,
    });
    const pagada = await facturaACredito(d, `${mes}-20`);
    await registrarPagoFactura(d, { uuid: pagada.uuid, fecha: `${sig}-05`, founderId: AUTOR });
    const cancelada = await facturaACredito(d, `${mes}-21`);
    const anulacion = await cancelarFactura(d, {
      uuid: cancelada.uuid,
      fecha: `${mes}-22`,
      motivo: 'Llegó con error',
      founderId: AUTOR,
    });

    const mios = new Set(
      [cobro, efectivo, errado, reversa, pagada.entry, cancelada.entry, anulacion].map((e) => e.id),
    );
    const todos = await importesDeResultados(d.db, `${mes}-01`, `${sig}-28`);
    const importes = todos.filter((i) => mios.has(i.entryId));
    const de = (id: string) => importes.filter((i) => i.entryId === id);

    assert.deepEqual(
      de(cobro.id).map((i) => [i.cuenta, i.importe, i.fechaFlujo]),
      [['ingresos', 10_000_00n, `${mes}-05`]],
    );
    assert.deepEqual(
      de(pagada.entry.id).map((i) => [i.fecha, i.fechaFlujo]),
      [[`${mes}-20`, `${sig}-05`]],
    );
    assert.deepEqual(
      de(cancelada.entry.id).map((i) => i.fechaFlujo),
      [null],
    );
    assert.deepEqual(
      de(anulacion.id).map((i) => [i.importe, i.fechaFlujo]),
      [[-3_500_00n, null]],
    );
    assert.deepEqual(
      de(reversa.id).map((i) => [i.importe, i.fechaFlujo]),
      [[-250_00n, `${mes}-08`]],
    );

    const enMes = (base: 'devengado' | 'flujo') =>
      estadoDeResultados(importes, parsePeriodo(mes)!, base);
    assert.equal(enMes('devengado').renglones.desarrollo, -3_500_00n);
    assert.equal(enMes('devengado').renglones.administracion, -1_000_00n);
    assert.equal(enMes('devengado').renglones.ebitda, 5_500_00n);
    assert.equal(enMes('flujo').renglones.desarrollo, 0n);
    assert.equal(enMes('flujo').renglones.ebitda, 9_000_00n);
    const siguiente = estadoDeResultados(importes, parsePeriodo(sig)!, 'flujo');
    assert.equal(siguiente.renglones.desarrollo, -3_500_00n);
  });

  it('reads nothing for a range with no entries, and only P&L accounts', async () => {
    const d = deps();
    assert.deepEqual(await importesDeResultados(d.db, '1990-01-01', '1990-12-31'), []);
    const todos = await importesDeResultados(d.db, '2000-01-01', '9999-12-31');
    const pyl = new Set<string>(CUENTAS_RESULTADOS);
    assert.ok(todos.length > 0);
    assert.ok(todos.every((i) => pyl.has(i.cuenta)));
  });
});
