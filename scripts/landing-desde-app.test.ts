/**
 * The legal pages the phone opens drop their link to the home page (X-05,
 * board TrLegal). The phone marks the URL from `@xangarro/domain`; the
 * landing, plain JS, reads the mark with its own copy of the name, so the two
 * are checked against each other here.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AVISO_DESDE_APP_URL,
  TERMINOS_DESDE_APP_URL,
} from '../packages/domain/src/privacidad/aviso-vinculacion';
import { PARAMETRO, VALOR, vieneDeLaApp } from '../apps/landing/src/pages/legal/desde-app.js';

/** A sessionStorage stand-in; `roto` throws like a browser with storage blocked. */
function almacen(roto = false) {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => {
      if (roto) throw new Error('SecurityError');
      return datos.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (roto) throw new Error('SecurityError');
      datos.set(k, v);
    },
  };
}

describe('a legal page knows it was opened from the phone', () => {
  it('reads the mark the phone puts on both addresses', () => {
    for (const url of [AVISO_DESDE_APP_URL, TERMINOS_DESDE_APP_URL]) {
      const { searchParams } = new URL(url);
      assert.equal(searchParams.get(PARAMETRO), VALOR, url);
      assert.equal(vieneDeLaApp(new URL(url).search, almacen()), true);
    }
  });

  it('stays marked for the rest of the tab, so the aviso linked from the terms is too', () => {
    const tab = almacen();
    assert.equal(vieneDeLaApp('?desde=app', tab), true);
    assert.equal(vieneDeLaApp('', tab), true);
  });

  it('is a plain web visit without the mark', () => {
    assert.equal(vieneDeLaApp('', almacen()), false);
    assert.equal(vieneDeLaApp('?utm_source=footer', almacen()), false);
  });

  it('ignores any other value of the parameter', () => {
    assert.equal(vieneDeLaApp('?desde=web', almacen()), false);
  });

  it('still honours the mark when the browser refuses storage', () => {
    assert.equal(vieneDeLaApp('?desde=app', almacen(true)), true);
    assert.equal(vieneDeLaApp('', almacen(true)), false);
    assert.equal(vieneDeLaApp('?desde=app', null), true);
  });
});
