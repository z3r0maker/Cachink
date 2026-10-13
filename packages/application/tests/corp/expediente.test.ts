import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { ArchivoInvalidoError, historial } from '@xangarro/domain/corp';

import {
  DocumentoDesconocidoError,
  DocumentoInvalidoError,
  MovimientoDesconocidoError,
  RegistrarMovimientoUseCase,
  subirDocumento,
  subirEvidencia,
  subirVersion,
  YaReemplazadoError,
} from '../../src/corp/index.js';
import { FakeAgenda, FakeDocumentos } from './fake-agenda.js';
import { FakeLedger } from './fake-ledger.js';

/** E-05: the Expediente's uploads and versions. */
const pdf = (texto: string) => ({
  nombre: `${texto}.pdf`,
  mime: 'application/pdf',
  contenido: new TextEncoder().encode(texto),
});

const deps = () => ({
  documentos: new FakeDocumentos(),
  ledger: new FakeLedger(),
  sha256: async () => 'b'.repeat(64),
});

const base = {
  carpeta: 'sat',
  titulo: 'Constancia de situación fiscal',
  periodo: '2026-09',
  entryId: null,
  tipo: 'otro' as const,
  hoy: '2026-10-08',
  founderId: 'f1',
};

describe('subirDocumento', () => {
  it('files a document in its folder, kept five years', async () => {
    const d = deps();
    const doc = await subirDocumento(d, { ...base, archivo: pdf('constancia') });
    assert.deepEqual(
      [doc.carpeta, doc.titulo, doc.periodo, doc.retenerHasta],
      ['sat', 'Constancia de situación fiscal', '2026-09', '2031-10-08'],
    );
  });

  it('links a factura to its ledger entry', async () => {
    const d = deps();
    const entry = await new RegistrarMovimientoUseCase(d.ledger).execute({
      fecha: '2026-10-05',
      projectId: null,
      concepto: 'Comisión',
      contraparte: null,
      founderId: 'f1',
      source: 'manual',
      sourceRef: null,
      usd: null,
      deducible: true,
      movement: { kind: 'comision_bancaria', monto: 10_00n },
    });
    const doc = await subirDocumento(d, {
      ...base,
      carpeta: 'comprobantes',
      entryId: entry.id,
      archivo: pdf('estado'),
    });
    assert.equal(doc.entryId, entry.id);
  });

  it('refuses an unknown folder, an empty title and a bad period', async () => {
    const d = deps();
    const archivo = pdf('x');
    await assert.rejects(
      subirDocumento(d, { ...base, carpeta: 'papelera', archivo }),
      DocumentoInvalidoError,
    );
    await assert.rejects(subirDocumento(d, { ...base, titulo: ' ', archivo }), /nombre/);
    await assert.rejects(subirDocumento(d, { ...base, periodo: 'sept', archivo }), /periodo/);
  });

  it('refuses a link to a movement that does not exist, and a file that is not evidence', async () => {
    const d = deps();
    await assert.rejects(
      subirDocumento(d, { ...base, entryId: 'nope', archivo: pdf('x') }),
      MovimientoDesconocidoError,
    );
    await assert.rejects(
      subirDocumento(d, { ...base, archivo: { ...pdf('x'), mime: 'application/zip' } }),
      ArchivoInvalidoError,
    );
  });
});

describe('subirVersion', () => {
  it('supersedes the current version and keeps both in the history', async () => {
    const d = deps();
    const v1 = await subirDocumento(d, { ...base, archivo: pdf('v1') });
    const v2 = await subirVersion(d, {
      documentoId: v1.id,
      archivo: pdf('v2'),
      hoy: '2026-10-09',
      founderId: 'f2',
    });
    assert.deepEqual([v2.titulo, v2.carpeta, v2.reemplazaA], [v1.titulo, 'sat', v1.id]);
    assert.deepEqual(
      historial(d.documentos.docs, v1.id).map((v) => [v.doc.nombre, v.version]),
      [
        ['v2.pdf', 2],
        ['v1.pdf', 1],
      ],
    );
  });

  it('refuses a new version of one already superseded', async () => {
    const d = deps();
    const v1 = await subirDocumento(d, { ...base, archivo: pdf('v1') });
    await subirVersion(d, {
      documentoId: v1.id,
      archivo: pdf('v2'),
      hoy: '2026-10-09',
      founderId: 'f1',
    });
    await assert.rejects(
      subirVersion(d, {
        documentoId: v1.id,
        archivo: pdf('v3'),
        hoy: '2026-10-09',
        founderId: 'f1',
      }),
      YaReemplazadoError,
    );
  });

  it('refuses a version of a document that does not exist', async () => {
    await assert.rejects(
      subirVersion(deps(), {
        documentoId: 'nope',
        archivo: pdf('x'),
        hoy: '2026-10-09',
        founderId: 'f1',
      }),
      DocumentoDesconocidoError,
    );
  });

  it('keeps an obligation showing only its current evidence', async () => {
    const d = { ...deps(), agenda: new FakeAgenda() };
    const acuse = await subirEvidencia(d, {
      plantillaId: 'isr_mensual',
      periodo: '2026-09',
      tipo: 'acuse',
      nombre: 'acuse.pdf',
      mime: 'application/pdf',
      contenido: new Uint8Array([1]),
      hoy: '2026-10-08',
      founderId: 'f1',
    });
    assert.deepEqual([acuse.carpeta, acuse.titulo], ['sat', 'Acuse · ISR provisional']);
    await subirVersion(d, {
      documentoId: acuse.id,
      archivo: pdf('corregido'),
      hoy: '2026-10-09',
      founderId: 'f1',
    });
    const actuales = await d.documentos.porObligacion(acuse.obligacionId ?? '');
    assert.deepEqual(
      actuales.map((x) => x.nombre),
      ['corregido.pdf'],
    );
  });
});
