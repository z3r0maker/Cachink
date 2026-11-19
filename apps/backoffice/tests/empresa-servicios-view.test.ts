import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { senalesDeServicios } from '../src/server/empresa/servicios-senales';
import { tarjetasUso } from '../src/server/empresa/servicios-uso-view';
import {
  filasServicios,
  mediosDePago,
  parseVer,
  tilesServicios,
} from '../src/server/empresa/servicios-view';
import { AZURE, DATOS, SUPABASE } from './servicios-fixture';

/** Servicios' list (E-24, board CD-18), read on 8 October 2026. */
describe('filasServicios', () => {
  const filas = filasServicios(DATOS, 'todos');
  const fila = (nombre: string) => filas.find((f) => f.nombre === nombre);

  it('lists every service but the dropped one', () => {
    assert.deepEqual(
      filas.map((f) => f.nombre),
      ['Azure AI Foundry', 'Vercel', 'Supabase', 'Facturapi', 'Apple Developer', 'Stripe'],
    );
  });

  it('averages what each one posted, and estimates one without a charge yet', () => {
    assert.equal(fila('Azure AI Foundry')?.promedio, '$873.33');
    assert.equal(fila('Vercel')?.promedio, '$368.00');
    assert.equal(fila('Supabase')?.promedio, '$0.00');
    assert.equal(fila('Facturapi')?.promedio, 'Est. $650.00');
    assert.equal(fila('Apple Developer')?.promedio, 'Est. USD 8.25');
    assert.equal(fila('Stripe')?.promedio, '$1,375.00');
  });

  it('says how each one charges, what pays it and when it charges next', () => {
    const v = fila('Vercel');
    assert.deepEqual(
      [v?.cobro, v?.pagaCon, v?.proximo],
      ['Fijo · USD 20.00', 'Tarjeta •••• 4821', '28 oct'],
    );
    assert.equal(fila('Supabase')?.cobro, 'Gratis · hasta 500 MB');
    assert.deepEqual(
      [fila('Stripe')?.pagaCon, fila('Stripe')?.proximo],
      ['Se descuenta del pago', 'Con cada pago'],
    );
    assert.equal(fila('Azure AI Foundry')?.proximo, 'Cada mes');
    assert.equal(fila('Facturapi')?.proximo, 'Al contratar');
    assert.equal(fila('Apple Developer')?.proximo, '1 nov');
  });

  it('marks a free plan at 62 %, one to contract, and a paid one that posted nothing as new', () => {
    assert.deepEqual(fila('Supabase')?.estado, { texto: '62 % del límite', tono: 'aviso' });
    assert.equal(fila('Facturapi')?.estado.texto, 'Por contratar');
    assert.equal(fila('Apple Developer')?.estado.texto, 'Nuevo');
    assert.equal(fila('Vercel')?.estado.texto, 'Activo');
  });

  it('narrows by chip, and takes an unknown one as every service', () => {
    const de = (ver: Parameters<typeof filasServicios>[1]) =>
      filasServicios(DATOS, ver).map((f) => f.nombre);
    assert.deepEqual(de('uso'), ['Azure AI Foundry', 'Stripe']);
    assert.deepEqual(de('fijos'), ['Vercel', 'Facturapi', 'Apple Developer']);
    assert.deepEqual(de('gratis'), ['Supabase']);
    assert.deepEqual(de('por_contratar'), ['Facturapi']);
    assert.equal(parseVer('trueque'), 'todos');
  });
});

describe('tilesServicios', () => {
  it('sums the averages of what is contracted, and counts the rest', () => {
    const [alMes, uso, gratis, contratar, renuevan] = tilesServicios(DATOS);
    assert.equal(alMes?.valor, '$2,616.33');
    assert.deepEqual(
      [uso?.label, uso?.valor, uso?.nota],
      ['Por uso, octubre', '$1,710.00', 'Proyección con 8 días de uso'],
    );
    assert.deepEqual([gratis?.valor, gratis?.nota, gratis?.aviso], ['1', 'Supabase', true]);
    assert.deepEqual([contratar?.valor, contratar?.nota], ['1', 'Facturapi']);
    assert.deepEqual([renuevan?.valor, renuevan?.nota], ['2', 'Vercel, Apple Developer']);
  });

  it('shows no usage projection without 3 days of reading', () => {
    const corto = { ...DATOS, servicios: [{ ...AZURE, gastoAl: '2026-10-02' }], hoy: '2026-10-02' };
    assert.equal(tilesServicios(corto)[1]?.valor, '—');
  });
});

describe('tarjetasUso', () => {
  const [azure, stripe] = tarjetasUso(DATOS);

  it("draws Azure's six months with October projected, and its rise", () => {
    assert.deepEqual(
      azure?.barras.map((b) => b.etiqueta),
      ['May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct*'],
    );
    assert.equal(azure?.barras[5]?.valor, '$1,710');
    assert.equal(azure?.barras[5]?.proyeccion, true);
    assert.equal(azure?.tendencia?.texto, '↑ 38 % vs sep');
    assert.equal(azure?.resumen, 'Sep $1,240 · octubre va a $1,710');
    assert.deepEqual([azure?.nota, azure?.pasa], ['Aviso si el mes pasa de $2,500.', false]);
  });

  it("reads Stripe's commission from its payouts", () => {
    assert.equal(stripe?.barras[4]?.valor, '$1,450');
    assert.equal(stripe?.tendencia?.texto, '↑ 12 % vs ago');
  });
});

describe('mediosDePago', () => {
  it('counts the contracted services each card pays', () => {
    assert.deepEqual(mediosDePago(DATOS), [
      { nombre: 'Tarjeta •••• 4821', cuantos: '3 servicios ligados' },
    ]);
  });
});

describe('senalesDeServicios', () => {
  it('raises a usage service projected past its alert, a free plan from 60 %, a renewal in 30 days', () => {
    const pasa = { ...AZURE, gastoMes: 733_00n };
    const s = senalesDeServicios({
      servicios: [pasa, SUPABASE, ...DATOS.servicios.slice(4)],
      hoy: DATOS.hoy,
    });
    assert.deepEqual(
      s.map((x) => [x.titulo, x.tono, x.href]),
      [
        ['Azure AI Foundry va a pasar de su aviso', 'warn', '/empresa/servicios/srv-azure'],
        ['Supabase va en 62 % de su plan gratis', 'info', '/empresa/servicios/srv-supabase'],
        ['Apple Developer renueva el 1 de noviembre', 'info', '/empresa/servicios/srv-apple'],
      ],
    );
  });

  it('says nothing for a dropped service, or a renewal beyond 30 days', () => {
    assert.deepEqual(
      senalesDeServicios({ servicios: [{ ...SUPABASE, estado: 'baja' }], hoy: DATOS.hoy }),
      [],
    );
    assert.deepEqual(
      senalesDeServicios({ servicios: DATOS.servicios.slice(4, 5), hoy: '2026-09-01' }),
      [],
    );
  });
});
