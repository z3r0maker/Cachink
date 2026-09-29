import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  CANDADO_CAJA,
  pedirCandado,
  reclamador,
  type Candados,
} from '../../src/operador/runtime/pestana';

/**
 * DB3-CAJA-01: one tab owns the register. A fake `navigator.locks` with the
 * Web Locks semantics the claim relies on: one holder per name, `ifAvailable`
 * answers `null` at once, a plain request queues, and a closing tab frees the
 * lock for the next in line.
 */
class LocksFalsos implements Candados {
  readonly nombres: string[] = [];
  #ocupado = false;
  readonly #cola: ((lock: unknown) => unknown)[] = [];

  request(
    nombre: string,
    opciones: { readonly ifAvailable?: boolean },
    fn: (lock: unknown) => unknown,
  ): Promise<unknown> {
    this.nombres.push(nombre);
    if (!this.#ocupado) return this.#dar(fn);
    if (opciones.ifAvailable === true) return Promise.resolve(fn(null));
    this.#cola.push(fn);
    return new Promise(() => undefined);
  }

  #dar(fn: (lock: unknown) => unknown): Promise<unknown> {
    this.#ocupado = true;
    return Promise.resolve(fn({ name: CANDADO_CAJA }));
  }

  /** The holding tab closes: the browser frees the lock, the next waiter gets it. */
  cerrarPestana(): void {
    this.#ocupado = false;
    const siguiente = this.#cola.shift();
    if (siguiente !== undefined) void this.#dar(siguiente);
  }
}

class LocksQueFallan implements Candados {
  request(): Promise<unknown> {
    return Promise.reject(new DOMException('denied', 'SecurityError'));
  }
}

describe('pedirCandado · one tab owns the register (DB3-CAJA-01)', () => {
  it('gives the register to the first tab, under the register lock name', async () => {
    const locks = new LocksFalsos();
    assert.equal(await pedirCandado(locks, false), 'propia');
    assert.deepEqual(locks.nombres, ['xangarro-register']);
  });

  it('tells a second tab the register is taken, without waiting', async () => {
    const locks = new LocksFalsos();
    await pedirCandado(locks, false);
    assert.equal(await pedirCandado(locks, false), 'ocupada');
  });

  it('«Usar esta pestaña» waits until the first tab closes, then owns it', async () => {
    const locks = new LocksFalsos();
    await pedirCandado(locks, false);
    let dueno: string | null = null;
    const espera = pedirCandado(locks, true).then((r) => (dueno = r));
    await Promise.resolve();
    assert.equal(dueno, null, 'still queued behind the open tab');
    locks.cerrarPestana();
    await espera;
    assert.equal(dueno, 'propia');
  });

  it('falls back to the old behaviour without Web Locks, or when they refuse', async () => {
    assert.equal(await pedirCandado(undefined, false), 'sin-soporte');
    assert.equal(await pedirCandado(new LocksQueFallan(), false), 'sin-soporte');
  });
});

describe('reclamador · the Worker opens the database only when it owns it', () => {
  it('refuses to open before a claim and while another tab holds it', async () => {
    const locks = new LocksFalsos();
    await pedirCandado(locks, false);
    const r = reclamador(locks);
    assert.equal(r.puedeAbrir(), false);
    assert.equal(await r.reclamar(false), 'ocupada');
    assert.equal(r.puedeAbrir(), false);
  });

  it('keeps an owned claim without asking the browser again', async () => {
    const locks = new LocksFalsos();
    const r = reclamador(locks);
    assert.equal(await r.reclamar(false), 'propia');
    assert.equal(await r.reclamar(false), 'propia');
    assert.equal(locks.nombres.length, 1);
    assert.equal(r.puedeAbrir(), true);
  });

  it('shares one waiting claim between callers', async () => {
    const locks = new LocksFalsos();
    await pedirCandado(locks, false);
    const r = reclamador(locks);
    const a = r.reclamar(true);
    const b = r.reclamar(true);
    locks.cerrarPestana();
    assert.deepEqual(await Promise.all([a, b]), ['propia', 'propia']);
    assert.equal(locks.nombres.length, 2, 'the first tab and one queued claim');
  });

  it('opens without Web Locks, as the caja always did', async () => {
    const r = reclamador(undefined);
    assert.equal(await r.reclamar(false), 'sin-soporte');
    assert.equal(r.puedeAbrir(), true);
  });
});

describe('the BroadcastChannel handshake · the no-Locks fallback (DB3-CAJA-01)', () => {
  it('an open register answers a newcomer within the window', async () => {
    const { hayOtraPestana, responderPresencia } =
      await import('../../src/operador/runtime/pestana');
    const parar = responderPresencia();
    assert.equal(await hayOtraPestana(200), true);
    parar();
    assert.equal(await hayOtraPestana(100), false);
  });

  it('nobody home means no other tab, and the window is waited', async () => {
    const { hayOtraPestana } = await import('../../src/operador/runtime/pestana');
    const t0 = Date.now();
    assert.equal(await hayOtraPestana(80), false);
    assert.ok(Date.now() - t0 >= 70);
  });
});
