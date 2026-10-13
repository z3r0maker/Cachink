import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';
import {
  actualizarRegistro,
  agregarCertificado,
  registrarEventoAcciones,
} from '@xangarro/application/corp';
import { tenencias } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import { createAgendaRepository } from '../src/queries/agenda';
import { createCorporativoRepository } from '../src/queries/corporativo';
import { createDocumentRepository } from '../src/queries/documentos';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * E-06's storage: share events with their beneficial-owner notice on the
 * Agenda, a certificate kept as a serial and a date (the database refuses a
 * key), and a seeded registry updated with its proof. Each test leaves the
 * seeded registry as it found it.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-corporativo-test';

const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is not set`);
  return value;
};

describe('corp corporate book storage', () => {
  const db = () => createCorpDb(url as string);
  const deps = () => ({
    corp: createCorporativoRepository(db()),
    agenda: createAgendaRepository(db()),
    documentos: createDocumentRepository(db()),
    ledger: createCorpLedgerRepository(db()),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  });
  let owner: postgres.Sql;
  let marca: Record<string, unknown> | undefined;

  beforeAll(async () => {
    owner = postgres(env('DATABASE_SUPER_URL'), { max: 1, onnotice: () => {} });
    [marca] = await owner`SELECT * FROM corp.registries WHERE id = 'marca'`;
  });

  afterAll(async () => {
    await owner`UPDATE corp.registries SET estado = ${String(marca?.estado)},
                referencia = ${(marca?.referencia as string | null) ?? null},
                siguiente = ${String(marca?.siguiente)}, al_dia = ${Boolean(marca?.al_dia)},
                document_id = NULL, updated_by = NULL, updated_at = NULL WHERE id = 'marca'`;
    await borrarLoDe(AUTOR);
    await owner.end();
  });

  it('records a share event and puts the beneficial-owner notice on the Agenda', async () => {
    const r = await registrarEventoAcciones(deps(), {
      evento: { fecha: '2098-03-02', tipo: 'suscripcion', de: null, a: 2, acciones: 7 },
      nota: 'Prueba',
      founderId: AUTOR,
    });
    const mios = (await createCorporativoRepository(db()).eventos()).filter(
      (e) => e.id === r.evento.id,
    );
    assert.deepEqual(tenencias(mios), { 1: 0, 2: 7, total: 7 });
    const aviso = await createAgendaRepository(db()).buscar(
      'beneficiario_controlador',
      '2098-03-02',
    );
    assert.equal(aviso?.estado, 'pendiente');
  });

  it('keeps a certificate as serial and date, and refuses anything else in the database', async () => {
    const c = await agregarCertificado(deps(), {
      certificado: {
        tipo: 'csd',
        titular: 'mexia',
        serie: '00001000000599999999',
        vence: '2098-11-18',
      },
      founderId: AUTOR,
    });
    assert.equal(c.serie, '00001000000599999999');
    const corp = postgres(url as string, { max: 1, onnotice: () => {} });
    try {
      await assert.rejects(
        corp`INSERT INTO corp.certificates (id, kind, holder, serial, expires_on, created_by, created_at)
             VALUES ('x', 'csd', 'mexia', '-----BEGIN PRIVATE KEY-----', '2099-01-01', ${AUTOR}, now())`,
        /certificates_serial_check/,
      );
      await assert.rejects(corp`DELETE FROM corp.certificates`, /permission denied/);
      await assert.rejects(corp`DELETE FROM corp.registries`, /permission denied/);
    } finally {
      await corp.end();
    }
  });

  it('updates a seeded registry and files its proof in its folder', async () => {
    const r = await actualizarRegistro(deps(), {
      id: 'marca',
      estado: 'En examen',
      referencia: '3141592',
      siguiente: 'Falta: cesión a MEXIA',
      alDia: false,
      archivo: {
        nombre: 'solicitud.pdf',
        mime: 'application/pdf',
        contenido: new Uint8Array([37, 80]),
      },
      hoy: '2026-10-08',
      founderId: AUTOR,
    });
    assert.deepEqual([r.estado, r.referencia, r.carpeta], ['En examen', '3141592', 'impi']);
    const doc = await createDocumentRepository(db()).porId(r.documentoId ?? '');
    assert.deepEqual([doc?.carpeta, doc?.titulo], ['impi', 'Marca Xangarro']);
  });
});
