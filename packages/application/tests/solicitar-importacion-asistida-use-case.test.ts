import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  SolicitarImportacionAsistidaUseCase,
  type ArchivoSolicitud,
  type AssistedImportsPort,
} from '../src/index.js';

function port(active = false): AssistedImportsPort & { created: unknown[] } {
  const store: { created: unknown[] } = { created: [] };
  return {
    ...store,
    hasActive: async () => active,
    create: async (input) => {
      store.created.push(input);
      return { id: '01HPM' };
    },
  };
}

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const file = (over: Partial<ArchivoSolicitud> = {}): ArchivoSolicitud => ({
  filename: 'datos.xlsx',
  mime: XLSX,
  bytes: Buffer.from('x'),
  ...over,
});

const BASE = {
  businessId: 'B1',
  paid: true,
  sistemaActual: 'Excel',
  notas: 'ventas y clientes',
  requestedBy: null,
} as const;

describe('SolicitarImportacionAsistidaUseCase', () => {
  let p: ReturnType<typeof port>;

  beforeEach(() => {
    p = port();
  });

  it('creates the request with trimmed text and the files', async () => {
    const r = await new SolicitarImportacionAsistidaUseCase(p).execute({
      ...BASE,
      files: [file()],
    });
    assert.equal(r.id, '01HPM');
    assert.equal(p.created.length, 1);
    assert.equal((p.created[0] as { sistemaActual: string }).sistemaActual, 'Excel');
  });

  it('refuses the free plan with the typed upsell error', async () => {
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(p).execute({ ...BASE, paid: false, files: [file()] }),
      (e: unknown) => (e as { code?: string }).code === 'IMPORTACION_ASISTIDA_NO_DISPONIBLE',
    );
    assert.equal(p.created.length, 0);
  });

  it('refuses a second request while one is in flight', async () => {
    const busy = port(true);
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(busy).execute({ ...BASE, files: [file()] }),
      (e: unknown) => (e as { code?: string }).code === 'IMPORTACION_ASISTIDA_YA_ACTIVA',
    );
    assert.equal(busy.created.length, 0);
  });

  it('refuses no files, too many files, a wrong type and an oversized file', async () => {
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(p).execute({ ...BASE, files: [] }),
      (e: unknown) => {
        assert.equal((e as { code?: string }).code, 'IMPORTACION_ASISTIDA_INVALIDA');
        assert.match((e as Error).message, /archivos/);
        return true;
      },
    );
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(p).execute({
        ...BASE,
        files: Array.from({ length: 6 }, () => file()),
      }),
      (e: unknown) => (e as Error).message.includes('máximo 5'),
    );
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(p).execute({
        ...BASE,
        files: [file({ mime: 'application/pdf' })],
      }),
      (e: unknown) => (e as Error).message.includes('solo .xlsx o .csv'),
    );
    await assert.rejects(
      new SolicitarImportacionAsistidaUseCase(p).execute({
        ...BASE,
        files: [file({ bytes: Buffer.alloc(21 * 1024 * 1024) })],
      }),
      (e: unknown) => (e as Error).message.includes('20 MB'),
    );
    assert.equal(p.created.length, 0);
  });
});
