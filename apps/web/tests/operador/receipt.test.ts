import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'vitest';
import { formatMoney } from '@xangarro/domain';

import {
  digits,
  GRACIAS,
  leerTelefono,
  receiptText,
  recordarTelefono,
  whatsappUrl,
  type Comprobante,
} from '../../src/operador/caja/receipt';

/**
 * The simple comprobante (N-21): its text, its WhatsApp link, and the phone
 * it remembers. The rendering and the download are the E2E suite's; what is
 * decided here — the lines, the country code, what survives a browser without
 * storage — is plain logic.
 */

const venta = {
  lines: [
    { productoId: 'p', nombre: 'Taco de pastor', precio: 25_00n, cantidad: 3 },
    { productoId: 'g', nombre: 'Gringa', precio: 45_00n, cantidad: 1 },
  ],
  total: 120_00n,
  metodo: 'Efectivo',
  cambio: null,
  nota: '',
} as unknown as Comprobante['venta'];

const c: Comprobante = { negocio: 'Taquería Don Pedro', folio: 'T-0042', venta };

class MemoryStorage {
  readonly items = new Map<string, string>();
  getItem(k: string): string | null {
    return this.items.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.items.set(k, v);
  }
}

function withStorage(storage: unknown): void {
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('receiptText and whatsappUrl', () => {
  it('names the business and folio, each line at its importe, the total and the thanks', () => {
    assert.deepEqual(receiptText(c).split('\n'), [
      'Taquería Don Pedro · T-0042',
      `3× Taco de pastor ${formatMoney(75_00n as never)}`,
      `1× Gringa ${formatMoney(45_00n as never)}`,
      `Total ${formatMoney(120_00n as never)} · Efectivo`,
      GRACIAS,
    ]);
  });

  it('dials Mexico: strips the formatting and prefixes 52', () => {
    assert.equal(digits('(55) 1234-5678'), '5512345678');
    const url = new URL(whatsappUrl('55 1234 5678', c));
    assert.equal(url.origin + url.pathname, 'https://wa.me/525512345678');
    assert.equal(url.searchParams.get('text'), receiptText(c));
  });
});

describe('the remembered phone', () => {
  it('is kept per cliente and as the last one used', () => {
    const storage = new MemoryStorage();
    withStorage(storage);
    recordarTelefono(' 5512345678 ', 'cli-1');
    assert.equal(leerTelefono('cli-1'), '5512345678');
    assert.equal(leerTelefono(), '5512345678');
    assert.equal(leerTelefono('cli-2'), '');
  });

  it('a blank phone is not remembered, and no cliente means only the last one', () => {
    const storage = new MemoryStorage();
    withStorage(storage);
    recordarTelefono('   ', 'cli-1');
    assert.equal(storage.items.size, 0);
    recordarTelefono('5500000000', '');
    assert.deepEqual([...storage.items.keys()], ['xg-share-tel']);
  });

  it('a browser without storage reads nothing and remembers nothing, without throwing', () => {
    withStorage({
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    });
    assert.equal(leerTelefono('cli-1'), '');
    assert.doesNotThrow(() => recordarTelefono('5512345678', 'cli-1'));
  });
});
