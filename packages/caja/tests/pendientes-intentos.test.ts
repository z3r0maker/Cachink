import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { COLA_FIXTURE } from '../src/pendientes/fixture';
import { estadoFila, fase, heroe } from '../src/pendientes/derive';
import { ayudaReintento, despuesDeReintentar, lineaIntento } from '../src/pendientes/intentos';
import type { RegistroEnCola } from '../src/pendientes/types';
import { comoRegistro } from '../src/pendientes/vivo';

const AHORA = new Date(2026, 4, 14, 19, 30, 0).getTime();
const MIN = 60_000;
const iso = (ms: number): string => new Date(ms).toISOString();

const venta = COLA_FIXTURE[0] as RegistroEnCola;
const enReintento: RegistroEnCola = {
  ...venta,
  reintento: true,
  ultimoIntento: iso(AHORA - 3 * MIN - 10_000),
  proximoIntento: iso(AHORA + 2 * MIN - 5_000),
};

describe('Registros por enviar while the engine retries (DS-05)', () => {
  it('says why per cause', () => {
    assert.equal(
      ayudaReintento({ en: AHORA, causa: 'ocupado' }),
      'El servidor está ocupado; reintentamos solos.',
    );
    assert.equal(
      ayudaReintento({ en: AHORA, causa: 'lenta' }),
      'La conexión está lenta; reintentamos solos.',
    );
    const siete42 = new Date(2026, 4, 14, 19, 42).getTime();
    assert.equal(
      ayudaReintento({ en: siete42, causa: 'esperar' }),
      'El servidor pidió esperar hasta las 7:42 p. m.',
    );
    assert.equal(ayudaReintento({ en: AHORA, causa: null }), '');
    assert.equal(ayudaReintento(null), '');
    assert.equal(
      despuesDeReintentar({ en: siete42, causa: 'esperar' }),
      'Lo enviamos a las 7:42 p. m., como pidió el servidor.',
    );
    assert.equal(
      despuesDeReintentar(null),
      'Todavía no se pudo. Lo volvemos a intentar solos en un momento.',
    );
  });

  it('turns the hero to «Reintentando» with the board’s words', () => {
    assert.equal(fase(COLA_FIXTURE, false, true), 'reintentando');
    assert.equal(fase(COLA_FIXTURE, true, true), 'enviando');
    assert.equal(fase([], false, true), 'enviado');
    const h = heroe('reintentando', COLA_FIXTURE, 3);
    assert.equal(h.eyebrow, 'Reintentando');
    assert.equal(h.titulo, '3 registros por enviar');
    assert.equal(
      h.cuerpo,
      'Suman $283.00 de ventas y un gasto de $620.00. Puedes seguir cobrando.',
    );
    assert.equal(h.boton, 'Reintentar envío');
    assert.equal(heroe('reintentando', [venta], 1).titulo, '1 registro por enviar');
  });

  it('chips a row already tried «En reintento»', () => {
    assert.equal(estadoFila('reintentando', false, enReintento), 'En reintento');
    assert.equal(estadoFila('espera', true, enReintento), 'En reintento');
    assert.equal(estadoFila('enviando', true, enReintento), 'Enviando');
    assert.equal(estadoFila('reintentando', false, venta), 'En cola');
  });
});

describe('each row in retry: last and next attempt (DS-07)', () => {
  it('says both, as the board does', () => {
    assert.equal(
      lineaIntento(enReintento, AHORA),
      'Último intento: hace 3 min · Próximo: en 2 min',
    );
  });

  it('follows the engine’s wait when it is later, and the server’s hour', () => {
    const motor = { en: AHORA + 4 * MIN, causa: 'ocupado' } as const;
    assert.equal(
      lineaIntento(enReintento, AHORA, motor),
      'Último intento: hace 3 min · Próximo: en 4 min',
    );
    const siete42 = new Date(2026, 4, 14, 19, 42).getTime();
    assert.equal(
      lineaIntento(enReintento, AHORA, { en: siete42, causa: 'esperar' }),
      'Último intento: hace 3 min · Próximo: a las 7:42 p. m.',
    );
    const antes = { en: AHORA + 30_000, causa: 'ocupado' } as const;
    assert.equal(
      lineaIntento(enReintento, AHORA, antes),
      'Último intento: hace 3 min · Próximo: en 2 min',
    );
  });

  it('a row still pending goes with the engine’s next run, not the ten-minute sweep', () => {
    const enviada = AHORA - MIN;
    const pendiente = {
      ...enReintento,
      ultimoIntento: iso(enviada),
      proximoIntento: iso(enviada + 10 * MIN),
    };
    const motor = { en: AHORA + 50_000, causa: 'ocupado' } as const;
    assert.equal(
      lineaIntento(pendiente, AHORA, motor),
      'Último intento: hace 1 min · Próximo: en 1 min',
    );
    // With no engine wait, the sweep is all there is to say.
    assert.equal(lineaIntento(pendiente, AHORA), 'Último intento: hace 1 min · Próximo: en 9 min');
  });

  it('a due row goes in a moment; no next time leaves the last alone', () => {
    const vencida = { ...enReintento, proximoIntento: iso(AHORA - MIN) };
    assert.equal(
      lineaIntento(vencida, AHORA),
      'Último intento: hace 3 min · Próximo: en un momento',
    );
    const sinProximo = { ...enReintento, proximoIntento: null };
    assert.equal(lineaIntento(sinProximo, AHORA), 'Último intento: hace 3 min');
  });

  it('has no line for a row never tried', () => {
    assert.equal(lineaIntento(venta, AHORA), null);
    assert.equal(lineaIntento({ ...enReintento, ultimoIntento: null }, AHORA), null);
    assert.equal(lineaIntento({ ...enReintento, reintento: false }, AHORA), null);
  });

  it('carries the attempt times from the outbox row', () => {
    const r = comoRegistro({
      tipo: 'gasto',
      id: 'g1',
      en: iso(AHORA),
      concepto: 'Gas',
      montoCentavos: '62000',
      proveedor: null,
      reintento: true,
      ultimoIntento: iso(AHORA - MIN),
      proximoIntento: null,
    });
    assert.equal(r.reintento, true);
    assert.equal(r.ultimoIntento, iso(AHORA - MIN));
    assert.equal(r.proximoIntento, null);
    const nuevo = comoRegistro({
      tipo: 'gasto',
      id: 'g2',
      en: iso(AHORA),
      concepto: 'Gas',
      montoCentavos: '1',
      proveedor: null,
    });
    assert.equal(nuevo.reintento, undefined);
  });
});
