import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  AvisoObligatorioError,
  cambiarCanal,
  preferenciasEfectivas,
  TIPOS_DE_AVISO,
} from '../../src/index.js';

describe('preferencias de avisos', () => {
  it('with nothing stored, every type gets its default channels', () => {
    const m = preferenciasEfectivas({});
    assert.equal(m.length, TIPOS_DE_AVISO.length);
    assert.deepEqual(
      m.find((r) => r.tipo === 'stock_bajo'),
      { tipo: 'stock_bajo', label: 'Stock bajo', critico: false, portal: true, correo: false },
    );
  });

  it('a stored choice overrides the default', () => {
    const m = preferenciasEfectivas({ stock_bajo: { correo: true, portal: false } });
    assert.deepEqual(
      m.find((r) => r.tipo === 'stock_bajo'),
      { tipo: 'stock_bajo', label: 'Stock bajo', critico: false, portal: false, correo: true },
    );
  });

  it('a critical type is always on, whatever was stored', () => {
    const m = preferenciasEfectivas({ discrepancia_caja: { portal: false, correo: false } });
    const r = m.find((x) => x.tipo === 'discrepancia_caja');
    assert.equal(r?.portal, true);
    assert.equal(r?.correo, true);
  });

  it('switching a channel returns the new stored map', () => {
    assert.deepEqual(cambiarCanal({}, 'stock_bajo', 'correo', true), {
      stock_bajo: { correo: true },
    });
  });

  it('refuses switching off a critical type', () => {
    assert.throws(
      () => cambiarCanal({}, 'registros_no_enviados', 'correo', false),
      AvisoObligatorioError,
    );
  });

  it('refuses an unknown type', () => {
    assert.throws(() => cambiarCanal({}, 'nada' as never, 'correo', true), TypeError);
  });

  it('ignores stored keys that are not notice types', () => {
    const m = preferenciasEfectivas({ viejo: { correo: true } } as never);
    assert.equal(
      m.some((r) => (r.tipo as string) === 'viejo'),
      false,
    );
  });
});
