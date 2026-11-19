/**
 * One open turno per caja (M-21, ADR-071 §3; board MvTurnoDeOtro): what the
 * phone says when someone signs in over another person's open turno, and how
 * Mi turno names the person who opened the turno they continue.
 */
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { notaFondo, sigueElTurnoDe, TURNO_DE_OTRO } from '../src/turno/titular';

describe('the turno of someone else', () => {
  it('names who opened it, by first name, and what it holds', () => {
    assert.equal(TURNO_DE_OTRO.titulo('Ana Robledo'), 'El turno de Ana sigue abierto');
    assert.equal(
      TURNO_DE_OTRO.detalle('08:15', 500_00n, 6),
      'Desde las 08:15 · fondo $500.00 · 6 ventas',
    );
    assert.equal(TURNO_DE_OTRO.detalle('08:15', 0n, 1), 'Desde las 08:15 · fondo $0.00 · 1 venta');
  });

  it('tells the newcomer the caja keeps one turno, and offers both ways', () => {
    assert.equal(
      TURNO_DE_OTRO.cuerpo('Toni', 'Ana Robledo'),
      'En esta caja va un turno a la vez, Toni. Sigue con el de Ana o ciérralo y abre el tuyo.',
    );
    assert.equal(TURNO_DE_OTRO.seguir('Ana'), 'Seguir con el turno de Ana');
    assert.equal(TURNO_DE_OTRO.cerrar('Ana'), 'Cerrar el turno de Ana');
    assert.equal(TURNO_DE_OTRO.cerrarCta('Ana'), 'Contar y cerrar el turno de Ana');
    assert.equal(TURNO_DE_OTRO.volver('Toni Pérez'), 'No soy Toni, volver');
  });

  it('copes with a blank name, never printing a stray comma or «de »', () => {
    assert.equal(TURNO_DE_OTRO.titulo('  '), 'El turno anterior sigue abierto');
    assert.equal(
      TURNO_DE_OTRO.cuerpo('', ''),
      'En esta caja va un turno a la vez. Sigue con este o ciérralo y abre el tuyo.',
    );
    assert.equal(TURNO_DE_OTRO.seguir(''), 'Seguir con este turno');
    assert.equal(TURNO_DE_OTRO.volver(''), 'Volver');
  });
});

describe('Mi turno, continuing it', () => {
  it('says whose turno it is and since when', () => {
    assert.equal(
      sigueElTurnoDe('Ana Robledo', '08:15'),
      'Sigues el turno de Ana. Lo abrió a las 08:15.',
    );
  });

  it('names who counted the fondo, or the operator themself', () => {
    assert.equal(notaFondo('Ana Robledo'), 'con el que abrió Ana');
    assert.equal(notaFondo(undefined), 'con el que abriste');
    assert.equal(notaFondo(''), 'con el que abriste');
  });
});
