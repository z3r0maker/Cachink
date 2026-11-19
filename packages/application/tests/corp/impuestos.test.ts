import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  DeclaracionInvalidaError,
  EvidenciaFaltanteError,
  TransicionInvalidaError,
  type Declaracion,
} from '@xangarro/domain/corp';

import {
  DeclaracionFaltanteError,
  DeclaracionPagadaError,
  avanzarDeclaracion,
  guardarDeclaracion,
  pagarDeclaracion,
  subirEvidencia,
  type DeclaracionRepository,
} from '../../src/corp/index.js';
import { FakeAgenda, FakeDocumentos } from './fake-agenda.js';
import { FakeLedger } from './fake-ledger.js';

/** E-13: the contador's declaration, the Agenda's «ISR e IVA» it moves, and its payment. */
class FakeDeclaraciones implements DeclaracionRepository {
  readonly rows = new Map<string, Declaracion>();
  async porPeriodo(periodo: string) {
    return this.rows.get(periodo) ?? null;
  }
  async lista(desde: string, hasta: string) {
    return [...this.rows.values()].filter((d) => d.periodo >= desde && d.periodo <= hasta);
  }
  async guardar(d: Declaracion) {
    this.rows.set(d.periodo, d);
  }
}

const OCTUBRE: Declaracion = {
  periodo: '2026-10',
  isr: 0n,
  iva: 566_85n,
  retencionIsr: 350_00n,
  retencionIva: 373_33n,
  lineaImporte: 1_290_18n,
  lineaVigencia: '2026-11-17',
};

const deps = () => ({
  declaraciones: new FakeDeclaraciones(),
  agenda: new FakeAgenda(),
  documentos: new FakeDocumentos(),
  ledger: new FakeLedger(),
  sha256: async () => 'a'.repeat(64),
});

type Deps = ReturnType<typeof deps>;

const subir = (d: Deps, tipo: 'acuse' | 'comprobante_pago') =>
  subirEvidencia(d, {
    plantillaId: 'impuestos_mensual',
    periodo: '2026-10',
    tipo,
    nombre: `${tipo}.pdf`,
    mime: 'application/pdf',
    contenido: new Uint8Array([37, 80, 68, 70]),
    hoy: '2026-11-12',
    founderId: 'f1',
  });

const guardar = (d: Deps, declaracion: Declaracion = OCTUBRE) =>
  guardarDeclaracion(d, { declaracion, founderId: 'f1' });

const pagar = (d: Deps) =>
  pagarDeclaracion(d, {
    periodo: '2026-10',
    fecha: '2026-11-14',
    concepto: 'ISR e IVA de octubre de 2026',
    founderId: 'f1',
  });

const estado = async (d: Deps) => (await d.agenda.buscar('impuestos_mensual', '2026-10'))?.estado;

describe('guardarDeclaracion', () => {
  it('keeps the figures and marks the month preparada', async () => {
    const d = deps();
    await guardar(d);
    assert.equal((await d.declaraciones.porPeriodo('2026-10'))?.iva, 566_85n);
    assert.equal(await estado(d), 'preparada');
  });

  it('files it straight away when its acuse is already attached', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await guardar(d);
    assert.equal(await estado(d), 'presentada');
  });

  it('refuses figures the domain refuses', async () => {
    const d = deps();
    await assert.rejects(guardar(d, { ...OCTUBRE, iva: -1n }), DeclaracionInvalidaError);
    assert.equal(d.declaraciones.rows.size, 0);
  });

  it('refuses to change a month already paid', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await guardar(d);
    await subir(d, 'comprobante_pago');
    await pagar(d);
    await assert.rejects(guardar(d, { ...OCTUBRE, iva: 600_00n }), DeclaracionPagadaError);
  });
});

describe('avanzarDeclaracion', () => {
  it('moves to presentada once the acuse arrives, and never back', async () => {
    const d = deps();
    await guardar(d);
    await subir(d, 'acuse');
    await avanzarDeclaracion(d, { periodo: '2026-10', founderId: 'f1' });
    assert.equal(await estado(d), 'presentada');
    await avanzarDeclaracion(d, { periodo: '2026-10', founderId: 'f1' });
    assert.equal(await estado(d), 'presentada');
  });

  it('leaves a month with nothing declared and no acuse pendiente', async () => {
    const d = deps();
    await avanzarDeclaracion(d, { periodo: '2026-10', founderId: 'f1' });
    assert.equal(await estado(d), 'pendiente');
  });
});

describe('pagarDeclaracion', () => {
  it('records the payment in the ledger, once, and marks the month pagada', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await guardar(d);
    await subir(d, 'comprobante_pago');
    const pago = await pagar(d);
    assert.equal(await estado(d), 'pagada');
    assert.equal(pago?.sourceRef, 'impuestos:2026-10');
    assert.equal(d.ledger.entries.length, 1);
    const bancos = d.ledger.entries[0]?.lines.find((l) => l.cuenta === 'bancos');
    assert.equal(bancos?.haber, 1_290_18n);
  });

  it('blocks «pagado» without the comprobante, and posts nothing', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await guardar(d);
    await assert.rejects(pagar(d), EvidenciaFaltanteError);
    assert.equal(d.ledger.entries.length, 0);
    assert.equal(await estado(d), 'presentada');
  });

  it('blocks it before the declaration is filed', async () => {
    const d = deps();
    await guardar(d);
    await subir(d, 'comprobante_pago');
    await assert.rejects(pagar(d), TransicionInvalidaError);
    assert.equal(d.ledger.entries.length, 0);
  });

  it('needs the contador’s figures first', async () => {
    await assert.rejects(pagar(deps()), DeclaracionFaltanteError);
  });

  it('closes a declaration en ceros without a comprobante or a movement', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await guardar(d, {
      ...OCTUBRE,
      iva: 0n,
      retencionIsr: 0n,
      retencionIva: 0n,
      lineaImporte: null,
    });
    assert.equal(await pagar(d), null);
    assert.equal(await estado(d), 'pagada');
    assert.equal((await d.agenda.buscar('impuestos_mensual', '2026-10'))?.sinPago, true);
    assert.equal(d.ledger.entries.length, 0);
  });
});
