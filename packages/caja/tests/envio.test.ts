import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { causaDe, leerFallo, pillEnvio, type EntradaPill } from '../src/comun/envio';
import { enMinutos, haceTiempo, horaDelDia } from '../src/comun/tiempo';

/** 14 May, 7:30 p. m. on the device's clock. */
const AHORA = new Date(2026, 4, 14, 19, 30, 0).getTime();
const MIN = 60_000;

const base: EntradaPill = {
  enLinea: true,
  enviando: false,
  pendientes: 3,
  rechazados: 0,
  reintento: null,
  ahora: AHORA,
};

describe('times said at the counter (DS-05, DS-07)', () => {
  it('says the hour of day the es-MX way', () => {
    assert.equal(horaDelDia(new Date(2026, 4, 14, 19, 42).getTime()), '7:42 p. m.');
    assert.equal(horaDelDia(new Date(2026, 4, 14, 0, 5).getTime()), '12:05 a. m.');
    assert.equal(horaDelDia(new Date(2026, 4, 14, 12, 0).getTime()), '12:00 p. m.');
    assert.equal(horaDelDia(new Date(2026, 4, 14, 9, 7).getTime()), '9:07 a. m.');
  });

  it('counts down in whole minutes, rounded up, never below one', () => {
    assert.equal(enMinutos(5_000), 'en 1 min');
    assert.equal(enMinutos(MIN), 'en 1 min');
    assert.equal(enMinutos(MIN + 1), 'en 2 min');
    assert.equal(enMinutos(-3_000), 'en 1 min');
  });

  it('says how long ago, and a clock running behind reads as just now', () => {
    assert.equal(haceTiempo(30_000), 'hace un momento');
    assert.equal(haceTiempo(-90_000), 'hace un momento');
    assert.equal(haceTiempo(3 * MIN + 20_000), 'hace 3 min');
    assert.equal(haceTiempo(125 * MIN), 'hace 2 h');
  });
});

describe('why the engine waits', () => {
  it('reads the cause from the failure', () => {
    assert.equal(causaDe({ code: 'SERVER_ERROR', status: 503 }), 'ocupado');
    assert.equal(causaDe({ code: 'RATE_LIMITED', status: 429 }), 'ocupado');
    assert.equal(causaDe({ code: 'TIMEOUT', status: 0 }), 'lenta');
    assert.equal(causaDe({ code: 'RATE_LIMITED', status: 429, retryAfterMs: 60_000 }), 'esperar');
    assert.equal(causaDe({ code: 'UNAUTHORIZED', status: 401 }), null);
  });

  it('reads a run: offline, a retry with its time, or nothing', () => {
    const retryAt = new Date(AHORA + MIN).toISOString();
    assert.deepEqual(leerFallo({ retryAt, error: { code: 'NETWORK', status: 0 } }), {
      sinRed: true,
      reintento: null,
    });
    assert.deepEqual(leerFallo({ retryAt, error: { code: 'TIMEOUT', status: 0 } }), {
      sinRed: false,
      reintento: { en: AHORA + MIN, causa: 'lenta' },
    });
    assert.deepEqual(leerFallo({ error: null }), { sinRed: false, reintento: null });
    assert.deepEqual(leerFallo({ retryAt: 'no es fecha', error: null }), {
      sinRed: false,
      reintento: null,
    });
  });
});

describe('the sync pill (DS-05)', () => {
  it('counts down to the engine’s retryAt in the warning state', () => {
    const p = pillEnvio({ ...base, reintento: { en: AHORA + 50_000, causa: 'ocupado' } });
    assert.equal(p.estado, 'reintentando');
    assert.equal(p.etiqueta, 'Reintentando en 1 min');
    assert.equal(p.corta, 'Reintentando en 1 min');
    assert.equal(p.aria, 'Estado del envío: Reintentando en 1 min');
    const luego = pillEnvio({ ...base, reintento: { en: AHORA + 4 * MIN + 1, causa: 'lenta' } });
    assert.equal(luego.etiqueta, 'Reintentando en 5 min');
  });

  it('names the hour when the server set Retry-After', () => {
    const en = new Date(2026, 4, 14, 19, 42).getTime();
    const p = pillEnvio({ ...base, reintento: { en, causa: 'esperar' } });
    assert.equal(p.etiqueta, 'Reintentando a las 7:42 p. m.');
    assert.equal(p.corta, 'Reintento: 7:42 p. m.');
  });

  it('leaves the retry once its time passed or nothing waits', () => {
    const vencido = { en: AHORA - 1, causa: 'ocupado' } as const;
    assert.equal(pillEnvio({ ...base, reintento: vencido }).estado, 'por-enviar');
    const vacio = { ...base, pendientes: 0, reintento: { en: AHORA + MIN, causa: null } };
    assert.equal(pillEnvio(vacio).etiqueta, 'Todo enviado');
    assert.equal(pillEnvio(vacio).corta, 'Enviado');
  });

  it('says sending, offline and refused as the boards do', () => {
    assert.equal(pillEnvio({ ...base, enviando: true }).etiqueta, 'Enviando 3 registros');
    assert.equal(
      pillEnvio({ ...base, pendientes: 1, enviando: true }).etiqueta,
      'Enviando 1 registro',
    );
    const sin = pillEnvio({ ...base, enLinea: false });
    assert.equal(sin.estado, 'sin-conexion');
    assert.equal(sin.etiqueta, 'Sin conexión · 3 sin enviar');
    assert.equal(sin.corta, '3 sin enviar');
    assert.equal(pillEnvio({ ...base, enLinea: false, pendientes: 0 }).etiqueta, 'Sin conexión');
    assert.equal(pillEnvio({ ...base, rechazados: 1 }).etiqueta, '1 rechazado');
    assert.equal(pillEnvio({ ...base, rechazados: 2 }).estado, 'con-rechazos');
  });

  it('a pull with nothing to send is not «Enviando»', () => {
    const p = pillEnvio({ ...base, pendientes: 0, enviando: true });
    assert.equal(p.estado, 'en-linea');
  });

  it('offline outranks a refusal, and a refusal outranks a retry', () => {
    const r = { en: AHORA + MIN, causa: 'ocupado' } as const;
    assert.equal(pillEnvio({ ...base, enLinea: false, rechazados: 1 }).estado, 'sin-conexion');
    assert.equal(pillEnvio({ ...base, rechazados: 1, reintento: r }).estado, 'con-rechazos');
  });
});
