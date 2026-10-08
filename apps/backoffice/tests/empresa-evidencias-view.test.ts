import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { agendaDe, type DocumentoMeta } from '@xangarro/application/corp';
import { CATALOGO } from '@xangarro/domain/corp';

import { matriz } from '../src/server/empresa/evidencias-view';

/** E-04's Evidencias: each monthly obligation by month, with its proofs. */
const HOY = '2026-10-08';
const MESES = ['2026-08', '2026-09', '2026-10'];

const doc = (id: string, obligacionId: string, tipo: DocumentoMeta['tipo']): DocumentoMeta => ({
  id,
  tipo,
  nombre: `${tipo}.pdf`,
  mime: 'application/pdf',
  tamano: 10,
  sha256: 'a'.repeat(64),
  obligacionId,
  retenerHasta: '2031-10-08',
  reemplazaA: null,
  subidoPor: 'f',
  subidoEn: '2026-09-17T12:00:00Z',
});

const vistas = agendaDe({
  catalogo: CATALOGO,
  inscripcion: '2026-08-03',
  guardadas: [
    {
      id: 'o1',
      plantillaId: 'isr_mensual',
      periodo: '2026-08',
      titulo: null,
      estado: 'pagada',
      sinPago: false,
    },
  ],
  hasta: '2026-12-31',
});

const filas = matriz(
  vistas,
  new Map([['o1', [doc('d1', 'o1', 'acuse'), doc('d2', 'o1', 'comprobante_pago')]]]),
  new Map([['isr_mensual~2026-08', 'o1']]),
  MESES,
  HOY,
);
const fila = (titulo: string) => filas.find((f) => f.titulo === titulo);

describe('matriz', () => {
  it('shows the proofs a filed and paid month has', () => {
    assert.deepEqual(
      fila('ISR provisional')?.celdas[0]?.pills.map((p) => p.texto),
      ['✓ Acuse', '✓ Pago'],
    );
  });

  it('shows what is missing while still on time', () => {
    assert.deepEqual(
      fila('ISR provisional')?.celdas[1]?.pills.map((p) => [p.texto, p.tono]),
      [
        ['Falta acuse', 'warn'],
        ['Falta pago', 'warn'],
      ],
    );
  });

  it('marks a month past its deadline without proof as late, once', () => {
    assert.deepEqual(
      fila('Revisión del buzón tributario')?.celdas[0]?.pills.map((p) => [p.texto, p.tono]),
      [['Vencida', 'bad']],
    );
  });

  it('leaves a month that is far from due empty', () => {
    assert.deepEqual(fila('IVA mensual')?.celdas[2]?.pills, []);
  });

  it('lists only the monthly obligations, with the proof they need', () => {
    assert.equal(fila('Declaración anual'), undefined);
    assert.equal(fila('ISR provisional')?.prueba, 'Acuse y comprobante de pago');
  });
});
