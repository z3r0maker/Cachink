import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  AccionesInsuficientesError,
  CertificadoInvalidoError,
  historial,
} from '@xangarro/domain/corp';

import {
  actualizarRegistro,
  agregarCertificado,
  registrarEventoAcciones,
  RegistroInvalidoError,
  subirVersion,
} from '../../src/corp/index.js';
import { FakeAgenda, FakeDocumentos } from './fake-agenda.js';
import { FakeCorporativo } from './fake-corporativo.js';
import { FakeLedger } from './fake-ledger.js';

/** E-06: the corporate book's writes and what they put on the Agenda. */
const deps = () => ({
  corp: new FakeCorporativo(),
  agenda: new FakeAgenda(),
  documentos: new FakeDocumentos(),
  ledger: new FakeLedger(),
  sha256: async () => 'c'.repeat(64),
});

describe('registrarEventoAcciones', () => {
  it('records a share event and its beneficial-owner notice 15 business days later', async () => {
    const d = deps();
    const r = await registrarEventoAcciones(d, {
      evento: { fecha: '2026-10-02', tipo: 'suscripcion', de: null, a: 1, acciones: 6_000 },
      nota: 'Constitución',
      founderId: 'f1',
    });
    assert.equal(r.evento.nota, 'Constitución');
    assert.deepEqual(
      [r.aviso.plantillaId, r.aviso.periodo],
      ['beneficiario_controlador', '2026-10-02'],
    );
  });

  it('refuses a transfer larger than the holding, and puts nothing on the Agenda', async () => {
    const d = deps();
    await assert.rejects(
      registrarEventoAcciones(d, {
        evento: { fecha: '2026-10-02', tipo: 'transmision', de: 2, a: 1, acciones: 1 },
        nota: '',
        founderId: 'f1',
      }),
      AccionesInsuficientesError,
    );
    assert.equal(d.agenda.rows.length, 0);
  });
});

describe('agregarCertificado', () => {
  const cert = {
    tipo: 'csd' as const,
    titular: 'mexia' as const,
    serie: '00001000000512345678',
    vence: '2026-11-18',
  };

  it('puts MEXIA’s CSD expiry on the Agenda', async () => {
    const d = deps();
    await agregarCertificado(d, { certificado: cert, founderId: 'f1' });
    assert.deepEqual(
      d.agenda.rows.map((r) => [r.plantillaId, r.periodo]),
      [['csd', '2026-11-18']],
    );
  });

  it('keeps a founder’s e.firma without adding it to MEXIA’s Agenda', async () => {
    const d = deps();
    await agregarCertificado(d, {
      certificado: { ...cert, tipo: 'efirma', titular: 'f2', vence: '2029-06-01' },
      founderId: 'f1',
    });
    assert.equal(d.corp.certs.length, 1);
    assert.equal(d.agenda.rows.length, 0);
  });

  it('refuses anything but a serial number', async () => {
    await assert.rejects(
      agregarCertificado(deps(), { certificado: { ...cert, serie: 'clave.key' }, founderId: 'f1' }),
      CertificadoInvalidoError,
    );
  });
});

describe('actualizarRegistro', () => {
  const pdf = (n: string) => ({
    nombre: `${n}.pdf`,
    mime: 'application/pdf',
    contenido: new Uint8Array([1, 2]),
  });
  const base = {
    id: 'marca',
    estado: 'En examen',
    referencia: ' 3141592 ',
    siguiente: 'Falta: cesión a MEXIA',
    alDia: false,
    hoy: '2026-10-08',
    founderId: 'f1',
  };

  it('files its proof, and makes the next upload a new version, even after the Expediente versioned it', async () => {
    const d = deps();
    const r1 = await actualizarRegistro(d, { ...base, archivo: pdf('solicitud') });
    assert.equal(r1.referencia, '3141592');
    const v2 = await subirVersion(d, {
      documentoId: r1.documentoId!,
      archivo: pdf('desde-expediente'),
      hoy: '2026-10-09',
      founderId: 'f1',
    });
    const r2 = await actualizarRegistro(d, {
      ...base,
      estado: 'Registrada',
      alDia: true,
      archivo: pdf('titulo'),
    });
    assert.deepEqual(
      historial(d.documentos.docs, r2.documentoId!).map((v) => [v.doc.nombre, v.version]),
      [
        ['titulo.pdf', 3],
        ['desde-expediente.pdf', 2],
        ['solicitud.pdf', 1],
      ],
    );
    assert.equal(d.documentos.docs.find((x) => x.id === r2.documentoId)?.reemplazaA, v2.id);
    assert.equal(r2.carpeta, 'impi');
  });

  it('keeps the proof when no file comes', async () => {
    const d = deps();
    const r1 = await actualizarRegistro(d, { ...base, archivo: pdf('solicitud') });
    const r2 = await actualizarRegistro(d, { ...base, archivo: null });
    assert.equal(r2.documentoId, r1.documentoId);
  });

  it('refuses an unknown registry and an empty status', async () => {
    await assert.rejects(
      actualizarRegistro(deps(), { ...base, id: 'nope', archivo: null }),
      RegistroInvalidoError,
    );
    await assert.rejects(
      actualizarRegistro(deps(), { ...base, estado: ' ', archivo: null }),
      /estado/,
    );
  });
});
