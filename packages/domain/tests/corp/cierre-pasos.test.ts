import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  pasosDelCierre,
  pasosPendientes,
  PASOS_CIERRE,
  type FuentesCierre,
} from '../../src/corp/cierre/index.js';

/** October as board CD-10 «Listo para cerrar» shows it (E-14). */
const listo: FuentesCierre = {
  emitidas: { global: 'timbrada', porEmitir: 0 },
  ingresos: { pagos: 38, sinImportar: 0 },
  recibidas: { gastos: 13, sinFactura: 0, porRevisar: 0 },
  banco: { consola: 48_210_55n, confirmado: 48_210_55n },
  impuestos: { obligada: true, presentada: true },
  agenda: { obligaciones: 2, pendientes: 0 },
  estados: { subidos: true },
};

const estado = (f: FuentesCierre, id: string) => pasosDelCierre(f).find((p) => p.id === id)?.estado;

describe('pasosDelCierre (E-14)', () => {
  it('reads the seven steps in the board order, all done', () => {
    const pasos = pasosDelCierre(listo);
    assert.deepEqual(
      pasos.map((p) => p.id),
      [...PASOS_CIERRE],
    );
    assert.ok(pasos.every((p) => p.estado === 'hecho'));
    assert.equal(pasosPendientes(pasos), 0);
  });

  it('leaves the bank and the statements to a founder (board «En curso»)', () => {
    const enCurso: FuentesCierre = {
      ...listo,
      banco: { consola: 48_210_55n, confirmado: null },
      estados: { subidos: false },
    };
    assert.equal(estado(enCurso, 'banco'), 'pendiente');
    assert.equal(estado(enCurso, 'estados'), 'pendiente');
    assert.equal(pasosPendientes(pasosDelCierre(enCurso)), 2);
  });

  it('undoes a confirmed balance once the ledger moves', () => {
    const f = { ...listo, banco: { consola: 48_193_15n, confirmado: 48_210_55n } };
    assert.equal(estado(f, 'banco'), 'pendiente');
  });

  it('marks a step the month does not need as «no aplica», which counts as done', () => {
    const vacio: FuentesCierre = {
      ...listo,
      emitidas: { global: null, porEmitir: 0 },
      ingresos: { pagos: 0, sinImportar: 0 },
      recibidas: { gastos: 0, sinFactura: 0, porRevisar: 0 },
      agenda: { obligaciones: 0, pendientes: 0 },
    };
    const pasos = pasosDelCierre(vacio);
    assert.deepEqual(
      pasos.filter((p) => p.estado === 'no_aplica').map((p) => p.id),
      ['emitidas', 'ingresos', 'recibidas', 'agenda'],
    );
    assert.equal(pasosPendientes(pasos), 0);
  });

  it('waits on an unstamped global, a payment to issue or one without its cobro', () => {
    assert.equal(
      estado({ ...listo, emitidas: { global: 'por_timbrar', porEmitir: 0 } }, 'emitidas'),
      'pendiente',
    );
    assert.equal(
      estado({ ...listo, emitidas: { global: null, porEmitir: 1 } }, 'emitidas'),
      'pendiente',
    );
    assert.equal(
      estado({ ...listo, ingresos: { pagos: 38, sinImportar: 2 } }, 'ingresos'),
      'pendiente',
    );
  });

  it('waits on an expense without its CFDI or an uploaded XML left to review', () => {
    assert.equal(
      estado({ ...listo, recibidas: { gastos: 13, sinFactura: 2, porRevisar: 0 } }, 'recibidas'),
      'pendiente',
    );
    assert.equal(
      estado({ ...listo, recibidas: { gastos: 0, sinFactura: 0, porRevisar: 1 } }, 'recibidas'),
      'pendiente',
    );
  });

  it('owes no declaration before the SAT registration', () => {
    const antes = { ...listo, impuestos: { obligada: false, presentada: false } };
    assert.equal(estado(antes, 'impuestos'), 'no_aplica');
  });

  it('waits on the declaration and on any open obligation of the month', () => {
    assert.equal(
      estado({ ...listo, impuestos: { obligada: true, presentada: false } }, 'impuestos'),
      'pendiente',
    );
    assert.equal(
      estado({ ...listo, agenda: { obligaciones: 2, pendientes: 1 } }, 'agenda'),
      'pendiente',
    );
  });
});
