import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { estadoDeTarjeta, plazoDeObjecion, valorDeTarjeta } from '../../src/corp/tablero/index.js';
import { ev, tarjeta } from './tablero-fixture.js';

describe('valorDeTarjeta (OD-4 §2)', () => {
  it('uses the average of both proposals', () => {
    assert.deepEqual(valorDeTarjeta(tarjeta()), { fuente: 'promedio', valor: 35_000_00n });
    const kit = tarjeta({ valores: { 1: 8_000_00n, 2: 12_000_00n } });
    assert.equal(valorDeTarjeta(kit).valor, 10_000_00n);
  });

  it('rounds an odd centavo up', () => {
    const t = tarjeta({ valores: { 1: 1_01n, 2: 1_00n } });
    assert.equal(valorDeTarjeta(t).valor, 1_01n);
  });

  it('has no value while a partner has not proposed one', () => {
    assert.deepEqual(valorDeTarjeta(tarjeta({ valores: { 1: null, 2: 30_000_00n } })), {
      fuente: 'falta',
      valor: null,
    });
  });

  it('asks for a quote when the proposals differ over 2×, exactly 2× is fine', () => {
    const radio = tarjeta({ valores: { 1: 10_000_00n, 2: 40_000_00n } });
    assert.deepEqual(valorDeTarjeta(radio), { fuente: 'cotizacion_requerida', valor: null });
    const doble = tarjeta({ valores: { 1: 10_000_00n, 2: 20_000_00n } });
    assert.equal(valorDeTarjeta(doble).fuente, 'promedio');
  });

  it('a quote is the value for both', () => {
    const t = tarjeta({ valores: { 1: 10_000_00n, 2: 40_000_00n }, cotizacion: 30_000_00n });
    assert.deepEqual(valorDeTarjeta(t), { fuente: 'cotizacion', valor: 30_000_00n });
  });

  it('a task has no value', () => {
    const t = tarjeta({ tipo: 'tarea', valores: { 1: null, 2: null } });
    assert.deepEqual(valorDeTarjeta(t), { fuente: 'falta', valor: null });
  });
});

describe('estadoDeTarjeta (OD-4 §3)', () => {
  it('starts in Por hacer and moves to En curso', () => {
    assert.equal(estadoDeTarjeta(tarjeta(), '2026-10-05').fase, 'por_hacer');
    const t = tarjeta({ eventos: [ev('iniciada', '2026-10-06', 1)] });
    assert.equal(estadoDeTarjeta(t, '2026-10-07').fase, 'en_curso');
  });

  it('terminado opens a 10-day window, then silence accepts on its last day', () => {
    assert.equal(plazoDeObjecion('2026-11-12'), '2026-11-22');
    const t = tarjeta({ eventos: [ev('terminada', '2026-11-12', 1)] });
    const abierta = estadoDeTarjeta(t, '2026-11-22');
    assert.equal(abierta.fase, 'en_revision');
    assert.equal(abierta.plazo, '2026-11-22');
    const callada = estadoDeTarjeta(t, '2026-11-23');
    assert.equal(callada.fase, 'aceptada');
    assert.equal(callada.aceptadaEl, '2026-11-22');
    assert.equal(callada.como, 'silencio');
    assert.equal(callada.cuentaEn, '2026-T4');
  });

  it('counts in the quarter it was finished in, even when accepted in the next', () => {
    const t = tarjeta({ eventos: [ev('terminada', '2026-12-29', 1)] });
    const e = estadoDeTarjeta(t, '2027-01-09');
    assert.equal(e.aceptadaEl, '2027-01-08');
    assert.equal(e.cuentaEn, '2026-T4');
  });

  it('the other partner may accept before the window ends', () => {
    const t = tarjeta({
      eventos: [ev('terminada', '2026-10-24', 2), ev('aceptada', '2026-10-25', 1)],
    });
    const e = estadoDeTarjeta(t, '2026-10-26');
    assert.equal(e.fase, 'aceptada');
    assert.equal(e.como, 'el_otro');
    assert.equal(e.aceptadaEl, '2026-10-25');
  });

  it('an objection stops the clock and keeps its reason', () => {
    const t = tarjeta({
      eventos: [ev('terminada', '2026-11-10', 2), ev('objetada', '2026-11-14', 1)],
    });
    const e = estadoDeTarjeta(t, '2026-12-31');
    assert.equal(e.fase, 'objetada');
    assert.equal(e.cuentaEn, null);
    assert.deepEqual(e.objecion, { fecha: '2026-11-14', motivo: 'Falta el video de inventario.' });
  });

  it('marked again after an objection gets ten new days', () => {
    const t = tarjeta({
      eventos: [
        ev('terminada', '2026-11-10', 2),
        ev('objetada', '2026-11-14', 1),
        ev('terminada', '2026-11-18', 2),
      ],
    });
    const e = estadoDeTarjeta(t, '2026-11-20');
    assert.equal(e.fase, 'en_revision');
    assert.equal(e.plazo, '2026-11-28');
  });

  it('the mediator accepts, or sends it back objected', () => {
    const base = [
      ev('terminada', '2026-11-10', 2),
      ev('objetada', '2026-11-14', 1),
      ev('al_mediador', '2026-11-20', 2),
    ];
    assert.equal(estadoDeTarjeta(tarjeta({ eventos: base }), '2026-11-21').fase, 'al_mediador');
    const si = estadoDeTarjeta(
      tarjeta({ eventos: [...base, ev('resuelta', '2026-11-25', 1, { aceptada: true })] }),
      '2026-11-26',
    );
    assert.equal(si.fase, 'aceptada');
    assert.equal(si.como, 'mediador');
    assert.equal(si.cuentaEn, '2026-T4');
    const no = estadoDeTarjeta(
      tarjeta({ eventos: [...base, ev('resuelta', '2026-11-25', 1, { aceptada: false })] }),
      '2026-11-26',
    );
    assert.equal(no.fase, 'objetada');
    assert.equal(no.mediadorNo, '2026-11-25');
  });

  it('a late event never reopens a card the silence accepted', () => {
    const t = tarjeta({
      eventos: [ev('terminada', '2026-11-12', 1), ev('objetada', '2026-11-30', 2)],
    });
    assert.equal(estadoDeTarjeta(t, '2026-12-01').fase, 'aceptada');
  });

  it('a task is done when marked, in the quarter of that day', () => {
    const t = tarjeta({ tipo: 'tarea', eventos: [ev('hecha', '2026-10-28', 1)] });
    const e = estadoDeTarjeta(t, '2026-10-29');
    assert.equal(e.fase, 'hecha');
    assert.equal(e.cuentaEn, '2026-T4');
  });
});
