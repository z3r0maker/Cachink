import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import { TableroError } from '@xangarro/domain/corp';

import {
  aceptadoDelTrimestre,
  crearTarjeta,
  enviarPlan,
  moverTarjeta,
  proponerValor,
  quitarDelPlan,
  responderPlan,
  usarCotizacion,
} from '../../src/corp/index.js';
import { FakeTablero } from './fake-tablero.js';

const codigo = (code: string) => (e: unknown) => e instanceof TableroError && e.code === code;

/** E-20: the 1T 2027 plan of board CD-13b, sent by F2 on 20 Dec and approved by F1. */
let repo: FakeTablero;
let deps: { tablero: FakeTablero };
let subidos: string[];
const adjunto = (id: string) => async () => {
  subidos.push(id);
  return id;
};

const nueva = (over: Partial<Parameters<typeof crearTarjeta>[1]> = {}) =>
  crearTarjeta(deps, {
    trimestre: '2027-T1',
    tipo: 'entregable',
    titulo: 'Integración con el SAT',
    criterio: 'Las facturas recibidas llegan solas del buzón.',
    responsable: 1,
    vence: '2027-03-15',
    objetivoId: null,
    valor: 30_000_00n,
    socio: 2,
    hoy: '2026-12-18',
    founderId: 'f2',
    ...over,
  });

beforeEach(() => {
  repo = new FakeTablero();
  deps = { tablero: repo };
  subidos = [];
});

describe('the plan of the quarter', () => {
  it("a card carries its creator's value; the other partner adds theirs", async () => {
    const id = await nueva();
    assert.deepEqual(repo.tarjetas[0]?.valores, { 1: null, 2: 30_000_00n });
    await proponerValor(deps, {
      tarjetaId: id,
      socio: 1,
      valor: 20_000_00n,
      hoy: '2026-12-19',
      founderId: 'f1',
    });
    assert.deepEqual(repo.tarjetas[0]?.valores, { 1: 20_000_00n, 2: 30_000_00n });
  });

  it('is sent by one partner and approved by the other once every value is in', async () => {
    const id = await nueva();
    await enviarPlan(deps, { trimestre: '2027-T1', socio: 2, hoy: '2026-12-20', founderId: 'f2' });
    await assert.rejects(
      responderPlan(deps, {
        trimestre: '2027-T1',
        socio: 1,
        aprobar: true,
        hoy: '2026-12-21',
        founderId: 'f1',
      }),
      codigo('PLAN_SIN_VALORES'),
    );
    await proponerValor(deps, {
      tarjetaId: id,
      socio: 1,
      valor: 30_000_00n,
      hoy: '2026-12-21',
      founderId: 'f1',
    });
    await assert.rejects(
      responderPlan(deps, {
        trimestre: '2027-T1',
        socio: 2,
        aprobar: true,
        hoy: '2026-12-21',
        founderId: 'f2',
      }),
      codigo('PLAN_EL_OTRO'),
    );
    await responderPlan(deps, {
      trimestre: '2027-T1',
      socio: 1,
      aprobar: true,
      hoy: '2026-12-21',
      founderId: 'f1',
    });
    assert.equal(repo.planes.at(-1)?.tipo, 'aprobado');
    await assert.rejects(
      proponerValor(deps, {
        tarjetaId: id,
        socio: 1,
        valor: 1n,
        hoy: '2026-12-22',
        founderId: 'f1',
      }),
      codigo('TARJETA_CONGELADA'),
    );
  });

  it("a card waiting for a quote gets its value from the third party's document", async () => {
    const id = await nueva({ valor: 10_000_00n });
    await proponerValor(deps, {
      tarjetaId: id,
      socio: 1,
      valor: 40_000_00n,
      hoy: '2026-12-19',
      founderId: 'f1',
    });
    await usarCotizacion(deps, {
      tarjetaId: id,
      monto: 30_000_00n,
      hoy: '2026-12-19',
      founderId: 'f1',
      adjunto: adjunto('cot'),
    });
    assert.equal(repo.tarjetas[0]?.cotizacion, 30_000_00n);
    assert.deepEqual(subidos, ['cot']);
  });

  it('files nothing when the quote is refused', async () => {
    const id = await nueva();
    await assert.rejects(
      usarCotizacion(deps, {
        tarjetaId: id,
        monto: 1n,
        hoy: '2026-12-19',
        founderId: 'f1',
        adjunto: adjunto('x'),
      }),
      codigo('COTIZACION_NO_REQUERIDA'),
    );
    assert.deepEqual(subidos, []);
  });

  it('a card leaves an unapproved plan', async () => {
    const id = await nueva();
    await quitarDelPlan(deps, {
      tarjetaId: id,
      trimestre: '2027-T1',
      hoy: '2026-12-19',
      founderId: 'f2',
    });
    assert.equal(repo.tarjetas[0]?.descartadaEn, '2027-T1');
  });

  it('refuses an unknown card, and an objective of another quarter', async () => {
    await assert.rejects(
      proponerValor(deps, {
        tarjetaId: 'nada',
        socio: 1,
        valor: 1n,
        hoy: '2026-12-19',
        founderId: 'f1',
      }),
      codigo('TARJETA_DESCONOCIDA'),
    );
    await assert.rejects(nueva({ objetivoId: 'nada' }), codigo('OBJETIVO_DESCONOCIDO'));
  });
});

describe('a card through review', () => {
  const valuada = async () => {
    const id = await nueva({ trimestre: '2026-T4', vence: '2026-12-15', hoy: '2026-11-01' });
    await proponerValor(deps, {
      tarjetaId: id,
      socio: 1,
      valor: 30_000_00n,
      hoy: '2026-11-01',
      founderId: 'f1',
    });
    return id;
  };
  const mover = (id: string, over: Partial<Parameters<typeof moverTarjeta>[1]>) =>
    moverTarjeta(deps, {
      tarjetaId: id,
      accion: 'terminar',
      socio: 1,
      hoy: '2026-11-12',
      enlace: null,
      motivo: null,
      aceptada: null,
      founderId: 'f1',
      adjunto: null,
      ...over,
    });

  it('finished with a file, objected, then the mediator accepts it', async () => {
    const id = await valuada();
    await mover(id, { adjunto: adjunto('evidencia') });
    await mover(id, {
      accion: 'objetar',
      socio: 2,
      motivo: 'Falta un mes completo.',
      hoy: '2026-11-14',
      founderId: 'f2',
    });
    await mover(id, { accion: 'mediador', socio: 1, motivo: 'Sí hay un mes.', hoy: '2026-11-20' });
    await mover(id, {
      accion: 'resolver',
      socio: 2,
      aceptada: true,
      hoy: '2026-11-25',
      adjunto: adjunto('fallo'),
    });
    assert.deepEqual(
      repo.tarjetas[0]?.eventos.map((e) => e.tipo),
      ['terminada', 'objetada', 'al_mediador', 'resuelta'],
    );
    assert.deepEqual(subidos, ['evidencia', 'fallo']);
    const r = aceptadoDelTrimestre(await repo.leer(), '2026-T4', '2027-01-01');
    assert.deepEqual(r, { cubierto: true, decidido: true, aceptado: { 1: 30_000_00n, 2: 0n } });
  });

  it('files nothing for a move that is refused', async () => {
    const id = await valuada();
    await assert.rejects(
      mover(id, { socio: 2, adjunto: adjunto('x') }),
      codigo('SOLO_RESPONSABLE'),
    );
    assert.deepEqual(subidos, []);
  });

  it('an objection of a quarter already decided does not reach the mediator', async () => {
    const id = await valuada();
    await mover(id, { enlace: 'https://xangarro.mx', hoy: '2026-12-20' });
    await mover(id, {
      accion: 'objetar',
      socio: 2,
      motivo: 'No.',
      hoy: '2026-12-22',
      founderId: 'f2',
    });
    await assert.rejects(
      mover(id, { accion: 'mediador', motivo: 'Sí.', hoy: '2027-01-02' }),
      codigo('MEDIADOR_CERRADO'),
    );
  });

  it('the money close waits for the quarter to be decided', async () => {
    const id = await valuada();
    await mover(id, { enlace: 'https://xangarro.mx', hoy: '2026-12-29' });
    assert.equal(aceptadoDelTrimestre(await repo.leer(), '2026-T4', '2027-01-05').decidido, false);
  });

  it('a quarter from before the Tablero is not covered, so its close keeps the typed value', async () => {
    await valuada();
    const r = aceptadoDelTrimestre(await repo.leer(), '2026-T3', '2026-11-01');
    assert.equal(r.cubierto, false);
  });
});
