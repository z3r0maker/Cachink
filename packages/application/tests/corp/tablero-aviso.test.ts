import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import { TableroError, textoDelAviso, type Tarjeta } from '@xangarro/domain/corp';

import {
  actualizarAvance,
  crearObjetivo,
  guardarClausula,
  marcarAvisoEnviado,
  prepararAviso,
} from '../../src/corp/index.js';
import { buildAvisoPdf } from '../../src/corp/tablero/aviso-pdf.js';
import { FakeTablero } from './fake-tablero.js';

const codigo = (code: string) => (e: unknown) => e instanceof TableroError && e.code === code;

const card = (over: Partial<Tarjeta>): Tarjeta => ({
  id: 'x',
  trimestre: '2026-T4',
  tipo: 'entregable',
  titulo: 'Lanzamiento público',
  criterio: 'En App Store.',
  responsable: 1,
  vence: '2026-12-15',
  objetivoId: null,
  valores: { 1: 30_000_00n, 2: 30_000_00n },
  cotizacion: null,
  cotizacionDocId: null,
  descartadaEn: null,
  eventos: [],
  ...over,
});

/** E-20: the 4T 2026 closed with F2 under the minimum (board CD-13d). */
let repo: FakeTablero;
let deps: { tablero: FakeTablero };

beforeEach(() => {
  repo = new FakeTablero();
  deps = { tablero: repo };
  repo.planes = [
    { trimestre: '2026-T4', tipo: 'enviado', socio: 1, fecha: '2026-10-01' },
    { trimestre: '2026-T4', tipo: 'aprobado', socio: 2, fecha: '2026-10-03' },
  ];
  repo.tarjetas = [
    card({
      id: 'a',
      eventos: [
        {
          tipo: 'terminada',
          socio: 1,
          fecha: '2026-11-02',
          enlace: 'https://a.mx',
          documentoId: null,
          motivo: null,
          aceptada: null,
        },
      ],
    }),
    card({ id: 'b', titulo: 'Alianza con una distribuidora', responsable: 2 }),
  ];
});

const marcar = (over: Partial<Parameters<typeof marcarAvisoEnviado>[1]> = {}) =>
  marcarAvisoEnviado(deps, {
    trimestre: '2026-T4',
    socio: 1,
    enviadoEl: '2027-01-09',
    hoy: '2027-01-09',
    founderId: 'f1',
    archivar: async () => 'doc-aviso',
    ...over,
  });

describe('the incumplimiento notice', () => {
  it('needs the clause first', async () => {
    await assert.rejects(marcar(), codigo('AVISO_SIN_CLAUSULA'));
  });

  it('is marked sent once, filed with the clause of that day', async () => {
    const id = await guardarClausula(deps, {
      numero: ' Décima segunda ',
      texto: 'Texto.',
      founderId: 'f1',
    });
    const a = await marcar();
    assert.deepEqual(a, {
      trimestre: '2026-T4',
      para: 2,
      enviadoEl: '2027-01-09',
      clausulaId: id,
      documentoId: 'doc-aviso',
      founderId: 'f1',
    });
    await assert.rejects(marcar(), codigo('AVISO_YA_ENVIADO'));
  });

  it('is sent by the partner who cumplió, and files nothing otherwise', async () => {
    await guardarClausula(deps, { numero: 'Décima segunda', texto: 'Texto.', founderId: 'f1' });
    let archivado = false;
    await assert.rejects(
      marcar({ socio: 2, archivar: async () => ((archivado = true), 'x') }),
      codigo('AVISO_EL_OTRO'),
    );
    assert.equal(archivado, false);
  });

  it("draws a PDF from the notice's words", async () => {
    await guardarClausula(deps, { numero: 'Décima segunda', texto: 'Texto.', founderId: 'f1' });
    const aviso = prepararAviso(await repo.leer(), '2026-T4', '2027-01-09');
    const pdf = await buildAvisoPdf(
      textoDelAviso(aviso, { 1: 'Ana', 2: 'Beto' }),
      '9 de enero de 2027',
    );
    assert.equal(new TextDecoder().decode(pdf.subarray(0, 5)), '%PDF-');
  });

  it('a clause without its text is refused', async () => {
    await assert.rejects(
      guardarClausula(deps, { numero: 'x', texto: ' ', founderId: 'f1' }),
      codigo('CLAUSULA_TEXTO'),
    );
  });
});

describe('objectives', () => {
  it('are created for the quarter and updated by hand inside it', async () => {
    const id = await crearObjetivo(deps, {
      trimestre: '2026-T4',
      quien: 2,
      titulo: '60 negocios pagando',
      meta: 60,
      unidad: 'negocios',
      hoy: '2026-10-02',
      founderId: 'f2',
    });
    await actualizarAvance(deps, {
      objetivoId: id,
      valor: 48,
      socio: 2,
      hoy: '2026-11-15',
      founderId: 'f2',
    });
    assert.deepEqual(repo.objetivos[0]?.avances, [{ valor: 48, fecha: '2026-11-15', socio: 2 }]);
    await assert.rejects(
      actualizarAvance(deps, {
        objetivoId: id,
        valor: 52,
        socio: 2,
        hoy: '2027-01-02',
        founderId: 'f2',
      }),
      codigo('OBJETIVO_CERRADO'),
    );
    await assert.rejects(
      actualizarAvance(deps, {
        objetivoId: 'nada',
        valor: 1,
        socio: 2,
        hoy: '2026-11-15',
        founderId: 'f2',
      }),
      codigo('OBJETIVO_DESCONOCIDO'),
    );
  });
});
