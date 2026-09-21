import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  archivoDe,
  mensajeCobranza,
  mensajeDiagnostico,
  mensajeLogro,
  nombreDelMes,
} from '../src/app/(portal)/asesor/compartir-mensajes';

/** The three bodies are the design file's own copy, with real money in them. */
describe('mensajes de WhatsApp (P-32)', () => {
  const datos = {
    negocio: 'Taquería Don Pedro',
    mes: '2026-09',
    ventas: 4_720_000n,
    utilidad: 1_519_700n,
  };

  it('diagnóstico: the month, the ventas, the utilidad', () => {
    assert.equal(
      mensajeDiagnostico(datos),
      'Le comparto el resumen de septiembre 2026 de Taquería Don Pedro: vendimos $47,200.00 y la utilidad fue de $15,197.00.',
    );
  });

  it('cobranza: the client, the saldo, the negocio', () => {
    assert.equal(
      mensajeCobranza({ cliente: 'Doña Lupe', saldo: 35_000n, negocio: 'Taquería Don Pedro' }),
      'Hola Doña Lupe, le recuerdo su saldo pendiente de $350.00 en Taquería Don Pedro. ¡Gracias!',
    );
  });

  it('logro: the month and what was sold', () => {
    assert.equal(
      mensajeLogro({ negocio: 'Taquería Don Pedro', mes: '2026-09', vendido: 5_712_000n }),
      'En septiembre 2026 vendimos $57,120.00 en Taquería Don Pedro y llegamos a nuestra meta del mes. ¡Gracias por venir!',
    );
  });

  it('zero figures still read as money, never blank', () => {
    assert.ok(mensajeDiagnostico({ ...datos, ventas: 0n, utilidad: 0n }).includes('$0.00'));
  });

  it('the chip names the artifact per variant; cobranza carries none', () => {
    assert.equal(archivoDe('diagnostico', '2026-09'), 'Diagnóstico-2026-09.pdf');
    assert.equal(archivoDe('logro', '2026-09'), 'Meta-2026-09.png');
    assert.equal(archivoDe('cobranza', '2026-09'), null);
  });

  it('month names cross the year', () => {
    assert.equal(nombreDelMes('2026-01'), 'enero 2026');
    assert.equal(nombreDelMes('2027-12'), 'diciembre 2027');
  });
});
