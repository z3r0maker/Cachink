import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import { marcarObligacion, subirEvidencia } from '@xangarro/application/corp';
import { EvidenciaFaltanteError } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import {
  contenidoDe,
  createAgendaRepository,
  createDocumentRepository,
  documentosDe,
} from '../src/queries/agenda';
import { borrarLoDe } from './cleanup';

/**
 * E-04's storage: the registration, an obligation's row and state, and its
 * evidence kept as bytes in corp, which the console can never change or
 * delete and the agents can read only as metadata (ADR-126).
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-agenda-test';
const PERIODO = '2099-01';

const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set`);
  return value;
};

describe('corp agenda storage', () => {
  const db = () => createCorpDb(url as string);
  const deps = () => ({
    agenda: createAgendaRepository(db()),
    documentos: createDocumentRepository(db()),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  });
  let antes: string | null = null;

  beforeAll(async () => {
    const agenda = createAgendaRepository(db());
    antes = await agenda.inscripcionRfc();
    await agenda.guardarInscripcion('2026-09-04', AUTOR);
  });

  afterAll(async () => {
    // Leave the singleton as found: restored by its earlier author's date, or removed.
    await borrarLoDe(AUTOR);
    if (antes !== null) await createAgendaRepository(db()).guardarInscripcion(antes, 'restaurado');
  });

  const marcar = (nuevo: 'presentada' | 'pagada') =>
    marcarObligacion(deps(), {
      plantillaId: 'iva_mensual',
      periodo: PERIODO,
      nuevo,
      sinPago: false,
      founderId: AUTOR,
    });

  it('keeps an acuse and lets the obligation be filed only after it', async () => {
    await assert.rejects(marcar('presentada'), EvidenciaFaltanteError);
    const bytes = new TextEncoder().encode('%PDF-1.7 acuse');
    const doc = await subirEvidencia(deps(), {
      plantillaId: 'iva_mensual',
      periodo: PERIODO,
      tipo: 'acuse',
      nombre: 'acuse-iva.pdf',
      mime: 'application/pdf',
      contenido: bytes,
      hoy: '2026-10-08',
      founderId: AUTOR,
    });
    assert.equal(doc.tamano, bytes.byteLength);
    assert.equal(doc.retenerHasta, '2031-10-08');

    const filed = await marcar('presentada');
    assert.equal(filed.estado, 'presentada');
    const listed = (await documentosDe(db(), [filed.id])).get(filed.id) ?? [];
    assert.deepEqual(
      listed.map((d) => d.nombre),
      ['acuse-iva.pdf'],
    );
    const back = await contenidoDe(db(), doc.id);
    assert.equal(back?.contenido.toString('utf8'), '%PDF-1.7 acuse');
  });

  it('never lets the console change or delete a document', async () => {
    const corp = postgres(url as string, { max: 1, onnotice: () => {} });
    try {
      await assert.rejects(corp`UPDATE corp.documents SET filename = 'x'`, /permission denied/);
      await assert.rejects(corp`DELETE FROM corp.documents`, /permission denied/);
      await assert.rejects(corp`DELETE FROM corp.obligations`, /permission denied/);
    } finally {
      await corp.end();
    }
  });

  it('shows the agents the metadata of a document, never its bytes', async () => {
    const agent = postgres(env('CORP_AGENT_URL'), { max: 1, onnotice: () => {} });
    try {
      await agent`SELECT id, filename, sha256 FROM corp.documents LIMIT 1`;
      await assert.rejects(agent`SELECT content FROM corp.documents LIMIT 1`, /permission denied/);
    } finally {
      await agent.end();
    }
  });
});
