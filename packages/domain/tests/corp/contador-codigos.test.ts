import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  assertPuedeValidar,
  CUENTAS_DEL_CATALOGO,
  ContadorError,
  cuentasPorGrupo,
  esCodigoAgrupador,
  estadoDeCodigos,
  faltantes,
  leerCodigos,
  mismosCodigos,
  type ListaDeCodigos,
  type ValidacionDeCodigos,
} from '../../src/corp/contador/index.js';
import type { AccountKey } from '../../src/corp/ledger/index.js';

const todos = (): Map<AccountKey, string> =>
  new Map(CUENTAS_DEL_CATALOGO.map((c, i) => [c, `${100 + i}.01`] as const));

const lista = (over: Partial<ListaDeCodigos> = {}): ListaDeCodigos => ({
  id: 'l1',
  codigos: todos(),
  capturadaPor: 'f1',
  capturadaAt: '2026-11-14T18:00:00.000Z',
  ...over,
});

const validacion = (over: Partial<ValidacionDeCodigos> = {}): ValidacionDeCodigos => ({
  id: 'v1',
  listaId: 'l1',
  validadaEl: '2026-11-14',
  marcadaPor: 'f2',
  marcadaAt: '2026-11-15T18:00:00.000Z',
  ...over,
});

const code = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof ContadorError, String(e));
    return e.code;
  }
  throw new Error('did not throw');
};

describe('códigos agrupadores (E-43)', () => {
  it('reads the chart: 22 accounts in its order, grouped as the board groups them', () => {
    assert.equal(CUENTAS_DEL_CATALOGO.length, 22);
    const grupos = cuentasPorGrupo();
    assert.deepEqual(
      grupos.map((g) => g.nombre),
      ['Activo', 'Pasivo', 'Capital', 'Ingresos', 'Costos y gastos', 'Otros'],
    );
    assert.equal(
      grupos.reduce((n, g) => n + g.cuentas.length, 0),
      22,
    );
    assert.deepEqual(grupos[4]?.cuentas, [
      'costo_servicio',
      'ventas_marketing',
      'desarrollo',
      'administracion',
      'depreciacion',
    ]);
  });

  it('takes a code as the contador writes it: three digits, optionally a dot and two more', () => {
    assert.equal(esCodigoAgrupador('102.01'), true);
    assert.equal(esCodigoAgrupador('401'), true);
    assert.equal(esCodigoAgrupador('102.1'), false);
    assert.equal(esCodigoAgrupador('1020.01'), false);
    assert.equal(esCodigoAgrupador('abc'), false);
  });

  it('reads a form: trims, leaves an empty one out, keeps the chart order', () => {
    const c = leerCodigos({ ingresos: ' 401.01 ', bancos: '102.01', afac: '' });
    assert.deepEqual(
      [...c],
      [
        ['bancos', '102.01'],
        ['ingresos', '401.01'],
      ],
    );
    assert.equal(faltantes(c).length, 20);
    assert.equal(faltantes(c)[0], 'stripe_por_depositar');
  });

  it('refuses a malformed code, naming the account', () => {
    assert.equal(
      code(() => leerCodigos({ bancos: '102-01' })),
      'CODIGO_FORMATO',
    );
    assert.match(
      (() => {
        try {
          leerCodigos({ bancos: '1' });
        } catch (e) {
          return (e as Error).message;
        }
        return '';
      })(),
      /Bancos/,
    );
  });

  it('refuses an account the chart does not have', () => {
    assert.equal(
      code(() => leerCodigos({ caja_chica: '101.01' })),
      'CODIGO_CUENTA',
    );
  });

  it('compares two lists by every code', () => {
    assert.equal(mismosCodigos(todos(), todos()), true);
    const otro = todos();
    otro.set('bancos', '102.02');
    assert.equal(mismosCodigos(todos(), otro), false);
    otro.delete('bancos');
    assert.equal(mismosCodigos(todos(), otro), false);
  });

  it('the state is the newest list and its own validation; an older validation does not count', () => {
    const vacio = estadoDeCodigos([], []);
    assert.equal(vacio.lista, null);
    assert.equal(vacio.faltan.length, 22);
    const nueva = lista({ id: 'l2', capturadaAt: '2026-11-16T18:00:00.000Z' });
    const e = estadoDeCodigos([lista(), nueva], [validacion()]);
    assert.equal(e.lista?.id, 'l2');
    assert.equal(e.validacion, null);
    assert.equal(estadoDeCodigos([lista()], [validacion()]).validacion?.id, 'v1');
  });

  it('validates the newest complete list once, on a past or present day', () => {
    assert.doesNotThrow(() =>
      assertPuedeValidar(estadoDeCodigos([lista()], []), 'l1', '2026-11-14', '2026-11-19'),
    );
  });

  it('refuses to validate with no list, or an older one', () => {
    assert.equal(
      code(() => assertPuedeValidar(estadoDeCodigos([], []), 'l1', '2026-11-14', '2026-11-19')),
      'CODIGOS_SIN_LISTA',
    );
    const e = estadoDeCodigos([lista(), lista({ id: 'l2' })], []);
    assert.equal(
      code(() => assertPuedeValidar(e, 'l1', '2026-11-14', '2026-11-19')),
      'CODIGOS_DESACTUALIZADA',
    );
  });

  it('refuses to validate an incomplete list, or one already validated', () => {
    const corta = todos();
    corta.delete('afac');
    const e = estadoDeCodigos([lista({ codigos: corta })], []);
    assert.equal(
      code(() => assertPuedeValidar(e, 'l1', '2026-11-14', '2026-11-19')),
      'CODIGOS_INCOMPLETOS',
    );
    const ya = estadoDeCodigos([lista()], [validacion()]);
    assert.equal(
      code(() => assertPuedeValidar(ya, 'l1', '2026-11-14', '2026-11-19')),
      'CODIGOS_YA_VALIDADOS',
    );
  });

  it('refuses a day that is not one, or one still to come', () => {
    const e = estadoDeCodigos([lista()], []);
    assert.equal(
      code(() => assertPuedeValidar(e, 'l1', '2026-02-30', '2026-11-19')),
      'CODIGOS_FECHA',
    );
    assert.equal(
      code(() => assertPuedeValidar(e, 'l1', '2026-11-20', '2026-11-19')),
      'CODIGOS_FECHA_FUTURA',
    );
  });
});
