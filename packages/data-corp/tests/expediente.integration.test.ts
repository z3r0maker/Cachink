import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { afterAll, it } from 'vitest';
import {
  RegistrarMovimientoUseCase,
  subirDocumento,
  subirVersion,
} from '@xangarro/application/corp';
import { historial } from '@xangarro/domain/corp';
import { integrationSuite } from '@xangarro/testing/integration';

import { createCorpDb } from '../src/client';
import {
  createDocumentRepository,
  documentosDelMovimiento,
  listarDocumentos,
} from '../src/queries/documentos';
import { createCorpLedgerRepository } from '../src/queries/ledger';
import { borrarLoDe } from './cleanup';

/**
 * E-05's storage: a document and its versions, both kept; a factura linked
 * to its ledger entry; and the database refusing two versions of one file.
 */
const { url, describe } = integrationSuite();
const AUTOR = 'f-expediente-test';

const archivo = (texto: string) => ({
  nombre: `${texto}.pdf`,
  mime: 'application/pdf',
  contenido: new TextEncoder().encode(`%PDF ${texto}`),
});

describe('corp expediente storage', () => {
  const db = () => createCorpDb(url as string);
  const deps = () => ({
    documentos: createDocumentRepository(db()),
    ledger: createCorpLedgerRepository(db()),
    sha256: async (b: Uint8Array) => createHash('sha256').update(b).digest('hex'),
  });
  const base = {
    carpeta: 'constitucion',
    titulo: `Acta constitutiva ${AUTOR}`,
    periodo: '2026',
    entryId: null,
    tipo: 'otro' as const,
    hoy: '2026-10-08',
    founderId: AUTOR,
  };

  afterAll(() => borrarLoDe(AUTOR));

  it('keeps both versions when a document is superseded, and refuses a second branch', async () => {
    const v1 = await subirDocumento(deps(), { ...base, archivo: archivo('v1') });
    const v2 = await subirVersion(deps(), {
      documentoId: v1.id,
      archivo: archivo('v2'),
      hoy: '2026-10-09',
      founderId: AUTOR,
    });
    const todos = (await listarDocumentos(db())).filter((d) => d.subidoPor === AUTOR);
    assert.deepEqual(
      historial(todos, v1.id).map((v) => [v.doc.id, v.version]),
      [
        [v2.id, 2],
        [v1.id, 1],
      ],
    );
    // Two versions racing past the use case still meet the unique constraint.
    await assert.rejects(
      createDocumentRepository(db()).guardar({
        ...v1,
        contenido: new Uint8Array([1]),
        obligacionId: null,
        reemplazaA: v1.id,
      }),
      (error: unknown) =>
        error instanceof Error && (error.cause as { code?: string } | undefined)?.code === '23505',
    );
  });

  it('links a document to the ledger entry it proves', async () => {
    const entry = await new RegistrarMovimientoUseCase(createCorpLedgerRepository(db())).execute({
      fecha: '2099-05-05',
      projectId: null,
      concepto: 'Comisión con estado de cuenta',
      contraparte: null,
      founderId: AUTOR,
      source: 'manual',
      sourceRef: null,
      usd: null,
      deducible: true,
      movement: { kind: 'comision_bancaria', monto: 10_00n },
    });
    await subirDocumento(deps(), {
      ...base,
      carpeta: 'comprobantes',
      titulo: 'Estado de cuenta',
      entryId: entry.id,
      archivo: archivo('estado'),
    });
    const docs = await documentosDelMovimiento(db(), entry.id);
    assert.deepEqual(
      docs.map((d) => [d.titulo, d.carpeta]),
      [['Estado de cuenta', 'comprobantes']],
    );
  });
});
