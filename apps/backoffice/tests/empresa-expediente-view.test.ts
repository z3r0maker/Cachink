import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { DocumentoMeta } from '@xangarro/application/corp';

import {
  conteos,
  filasDe,
  historialDe,
  type Contexto,
} from '../src/server/empresa/expediente-view';

/** E-05's Expediente in the board's words. */
const doc = (over: Partial<DocumentoMeta> & Pick<DocumentoMeta, 'id'>): DocumentoMeta => ({
  tipo: 'otro',
  carpeta: 'sat',
  titulo: 'Constancia de situación fiscal',
  periodo: '2026-10',
  nombre: 'constancia.pdf',
  mime: 'application/pdf',
  tamano: 10,
  sha256: 'a'.repeat(64),
  obligacionId: null,
  entryId: null,
  retenerHasta: '2031-10-03',
  reemplazaA: null,
  subidoPor: 'f1',
  subidoEn: '2026-09-12T15:00:00Z',
  ...over,
});

const docs = [
  doc({ id: 'c1' }),
  doc({ id: 'c2', reemplazaA: 'c1', subidoEn: '2026-10-03T15:00:00Z' }),
  doc({
    id: 'a1',
    titulo: 'Acuse · ISR provisional',
    periodo: '2026-08',
    obligacionId: 'o1',
    subidoPor: 'f2',
    subidoEn: '2026-09-17T15:00:00Z',
  }),
  doc({ id: 'k1', carpeta: 'constitucion', titulo: 'Acta constitutiva', periodo: null }),
];

const contexto: Contexto = {
  obligaciones: new Map([
    [
      'o1',
      {
        texto: 'Agenda · ISR provisional de agosto de 2026',
        href: '/empresa/agenda/isr_mensual/2026-08',
      },
    ],
  ]),
  movimientos: new Map(),
  socios: new Map([
    ['f1', 1],
    ['f2', 2],
  ]),
};

describe('filasDe', () => {
  it('shows each document once, at its current version, newest first', () => {
    const filas = filasDe(docs, 'sat', contexto);
    assert.deepEqual(
      filas.map((f) => [f.titulo, f.version, f.periodo, f.subido, f.vinculo?.texto ?? null]),
      [
        ['Constancia de situación fiscal', 'PDF · v2', 'Oct 2026', '3 oct · F1', null],
        [
          'Acuse · ISR provisional',
          'PDF · v1',
          'Ago 2026',
          '17 sep · F2',
          'Agenda · ISR provisional de agosto de 2026',
        ],
      ],
    );
  });

  it('marks a document without a period with the empty placeholder', () => {
    assert.equal(filasDe(docs, 'constitucion', contexto)[0]?.periodo, '—');
  });

  it('shows an empty folder as no rows', () => {
    assert.deepEqual(filasDe(docs, 'contratos', contexto), []);
  });
});

describe('conteos', () => {
  it('counts current documents per folder, not versions', () => {
    const c = conteos(docs);
    assert.deepEqual([c.get('sat'), c.get('constitucion'), c.get('impi')], [2, 1, 0]);
  });
});

describe('historialDe', () => {
  it('tells each version’s story, newest first', () => {
    const h = historialDe(docs, 'c1', contexto);
    assert.deepEqual(
      h?.lineas.map((l) => l.texto),
      [
        'v2 · subida el 3 oct por Fundador 1 · vigente',
        'v1 · subida el 12 sep por Fundador 1 · reemplazada por v2',
      ],
    );
    assert.equal(h?.vigenteId, 'c2');
    assert.equal(h?.conservaHasta, '2031');
  });

  it('has no history for an unknown document', () => {
    assert.equal(historialDe(docs, 'zz', contexto), null);
  });
});
