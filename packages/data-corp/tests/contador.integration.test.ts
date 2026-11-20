import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import {
  armarPaquete,
  guardarCodigos,
  leerEstadoDeCodigos,
  RegistrarMovimientoUseCase,
  validarCodigos,
  type RegistrarMovimientoInput,
} from '@xangarro/application/corp';
import { balanzaDelMes, CUENTAS_DEL_CATALOGO, type Movement } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb, type CorpDb } from '../src/client';
import {
  createCodigosRepository,
  recibidasDelPaquete,
  sumasPorTramo,
  xmlsDelPaquete,
} from '../src/queries/contador';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { crearBaseDesechable, type BaseDesechable } from './base-desechable';

/**
 * The contador's export (E-43) against rows the seed does not have. The
 * balanza is cumulative and the codes list is the company's one, so it runs
 * in a database of its own, as `xangarro_corp`, the console's login: a cobro
 * of last year, an expense earlier this year, a cobro and an invoiced expense
 * in the month, and one after it; then codes saved, validated, changed.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-contador-test';

const movimiento = (fecha: string, movement: Movement): RegistrarMovimientoInput => ({
  fecha,
  projectId: 'xangarro',
  concepto: `Contador ${movement.kind} ${fecha}`,
  contraparte: null,
  founderId: AUTOR,
  source: 'manual',
  sourceRef: null,
  usd: null,
  deducible: true,
  movement,
});

const cobro = (subtotal: bigint): Movement => ({
  kind: 'cobro',
  subtotal,
  iva: subtotal / 10n,
  destino: 'bancos',
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

const UUID = 'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE';

describe('corp contador', () => {
  let base: BaseDesechable;
  let db: CorpDb;

  beforeAll(async () => {
    base = await crearBaseDesechable();
    await base.aplicar(() => true);
    const u = new URL(url as string);
    u.pathname = `/${base.nombre}`;
    db = createCorpDb(u.toString(), 1);
    const registrar = new RegistrarMovimientoUseCase(createCorpLedgerRepository(db));
    await registrar.execute(movimiento('2025-12-10', cobro(1_000_00n)));
    await registrar.execute(movimiento('2026-03-03', gasto(500_00n)));
    await registrar.execute(movimiento('2026-10-02', cobro(2_000_00n)));
    const conFactura = await registrar.execute(movimiento('2026-10-20', gasto(300_00n)));
    await registrar.execute(movimiento('2026-11-01', gasto(9_999_00n)));
    await base.sql`INSERT INTO corp.received_invoices (uuid, fecha, emisor_rfc, emisor_nombre,
        receptor_rfc, uso_cfdi, metodo_pago, moneda, subtotal, iva, retencion_isr, retencion_iva,
        total, concepto, sat_total, sello8, archivo, xml, estado, estado_sat, categoria, entry_id,
        created_by, created_at, updated_at)
      VALUES (${UUID}, '2026-10-20', 'AAA010101AAA', 'Proveedor', 'MEX010101AAA', 'G03', 'PUE',
        'MXN', 30000, 0, 0, 0, 30000, 'Servicio', '300.00', 'ABCDEFGH', 'proveedor.xml',
        ${Buffer.from('<cfdi:Comprobante/>')}, 'registrada', 'vigente', 'administracion',
        ${conFactura.id}, ${AUTOR}, now(), now())`;
  });

  afterAll(async () => {
    await db?.$client.end({ timeout: 5 });
    await base?.cerrar();
  });

  it('sums each account over the three stretches, up to the month only', async () => {
    const sumas = await sumasPorTramo(db, '2026-10');
    const de = (cuenta: string, tramo: string) =>
      sumas.find((s) => s.cuenta === cuenta && s.tramo === tramo);
    assert.equal(de('ingresos', 'anterior')?.haber, 1_000_00n);
    assert.equal(de('administracion', 'ejercicio')?.debe, 500_00n);
    assert.equal(de('ingresos', 'mes')?.haber, 2_000_00n);
    assert.equal(de('administracion', 'mes')?.debe, 300_00n);
    assert.equal(
      sumas.some((s) => s.debe === 9_999_00n || s.haber === 9_999_00n),
      false,
    );
  });

  it('the balanza from the real ledger balances, with last year in Resultados acumulados', async () => {
    const b = balanzaDelMes(await sumasPorTramo(db, '2026-10'), new Map());
    assert.equal(b.cuadra, true);
    const fila = (c: string) => b.filas.find((f) => f.cuenta === c);
    assert.equal(fila('resultados_acumulados')?.inicial, 1_000_00n);
    assert.equal(fila('ingresos')?.inicial, 0n);
    assert.equal(fila('ingresos')?.final, 2_000_00n);
    assert.equal(fila('administracion')?.inicial, 500_00n);
  });

  it("reads the month's registered invoices, with and without their XML", async () => {
    assert.deepEqual(await recibidasDelPaquete(db, '2026-10'), [
      { uuid: UUID, archivo: 'proveedor.xml' },
    ]);
    const [xml] = await xmlsDelPaquete(db, '2026-10');
    assert.equal(new TextDecoder().decode(xml?.xml), '<cfdi:Comprobante/>');
    assert.deepEqual(await recibidasDelPaquete(db, '2026-09'), []);
  });

  it('saves codes, validates the newest list, and a change leaves it unvalidated', async () => {
    const repo = createCodigosRepository(db);
    const todos = Object.fromEntries(CUENTAS_DEL_CATALOGO.map((c, i) => [c, `${100 + i}.01`]));
    const primera = await guardarCodigos({ codigos: repo }, { codigos: todos, founderId: AUTOR });
    assert.ok(primera);
    await validarCodigos(
      { codigos: repo },
      { listaId: primera.id, fecha: '2026-11-14', hoy: '2026-11-19', founderId: AUTOR },
    );
    let e = await leerEstadoDeCodigos(repo);
    assert.equal(e.validacion?.validadaEl, '2026-11-14');
    assert.equal(e.lista?.codigos.size, 22);
    await guardarCodigos(
      { codigos: repo },
      { codigos: { ...todos, bancos: '102.01' }, founderId: AUTOR },
    );
    e = await leerEstadoDeCodigos(repo);
    assert.notEqual(e.lista?.id, primera.id);
    assert.equal(e.lista?.codigos.get('bancos'), '102.01');
    assert.equal(e.validacion, null);
  });

  it('the trigger refuses to validate a list that is not the newest', async () => {
    const repo = createCodigosRepository(db);
    const [vieja] = await repo.listas();
    assert.ok(vieja);
    await assert.rejects(
      repo.validar({ listaId: vieja.id, fecha: '2026-11-14', founderId: AUTOR }),
      (e: unknown) => /not the newest/.test(String((e as { cause?: unknown }).cause)),
    );
  });

  it('the console cannot change or delete a code', async () => {
    await assert.rejects(
      db.$client`UPDATE corp.account_codes SET code = '999.99'`,
      /permission denied/,
    );
    await assert.rejects(db.$client`DELETE FROM corp.account_code_lists`, /permission denied/);
  });

  it('builds the package from it', async () => {
    const p = await armarPaquete(
      {
        codigos: createCodigosRepository(db),
        sumas: (mes) => sumasPorTramo(db, mes),
        cerrado: async () => false,
        emitidas: async () => [],
        recibidas: (mes) => xmlsDelPaquete(db, mes),
        comprobantes: async () => [],
      },
      { mes: '2026-10', hoy: '2026-11-19' },
    );
    assert.deepEqual(
      p.archivos.map((a) => a.ruta),
      ['balanza-2026-10.csv', 'emitidas.csv', 'recibidas/proveedor.xml'],
    );
    assert.match(String(p.archivos[0]?.contenido), /\r\n102\.01,Bancos,Deudora,/);
  });
});
