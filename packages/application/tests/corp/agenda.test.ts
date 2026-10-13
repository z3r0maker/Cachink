import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  ArchivoInvalidoError,
  CATALOGO,
  EvidenciaFaltanteError,
  FechaInvalidaError,
  ObligacionDesconocidaError,
  ObligacionExentaError,
} from '@xangarro/domain/corp';

import {
  agendaDe,
  agregarVencimiento,
  ConceptoRequeridoError,
  guardarInscripcion,
  InscripcionFuturaError,
  marcarObligacion,
  subirEvidencia,
} from '../../src/corp/index.js';
import { FakeAgenda, FakeDocumentos } from './fake-agenda.js';

/** E-04: the Agenda's view and its writes. */
const sha256 = async () => 'a'.repeat(64);
const pdf = new Uint8Array([37, 80, 68, 70]);

const deps = () => ({ agenda: new FakeAgenda(), documentos: new FakeDocumentos(), sha256 });

const subir = (d: ReturnType<typeof deps>, tipo: 'acuse' | 'comprobante_pago') =>
  subirEvidencia(d, {
    plantillaId: 'isr_mensual',
    periodo: '2026-09',
    tipo,
    nombre: `${tipo}.pdf`,
    mime: 'application/pdf',
    contenido: pdf,
    hoy: '2026-10-08',
    founderId: 'f1',
  });

const marcar = (d: ReturnType<typeof deps>, nuevo: 'presentada' | 'pagada', sinPago = false) =>
  marcarObligacion(d, {
    plantillaId: 'isr_mensual',
    periodo: '2026-09',
    nuevo,
    sinPago,
    founderId: 'f1',
  });

describe('agendaDe', () => {
  it('computes the periods since the registration and adds the one-offs', async () => {
    const d = deps();
    await agregarVencimiento(d.agenda, {
      plantillaId: 'csd',
      fecha: '2026-11-18',
      titulo: '',
      founderId: 'f1',
    });
    const lista = agendaDe({
      catalogo: CATALOGO,
      inscripcion: '2026-09-04',
      guardadas: await d.agenda.obligaciones(),
      hasta: '2026-11-30',
    });
    const isr = lista.find((o) => o.plantilla.id === 'isr_mensual');
    assert.deepEqual(
      [isr?.periodo, isr?.vence, isr?.estado],
      ['2026-09', '2026-10-19', 'pendiente'],
    );
    assert.ok(lista.some((o) => o.plantilla.id === 'csd' && o.vence === '2026-11-18'));
  });

  it('computes nothing recurring until the registration is set', () => {
    const lista = agendaDe({
      catalogo: CATALOGO,
      inscripcion: null,
      guardadas: [],
      hasta: '2026-12-31',
    });
    assert.deepEqual(lista, []);
  });
});

describe('the evidence rule', () => {
  it('files and pays a declaration with its acuse and its proof', async () => {
    const d = deps();
    await subir(d, 'acuse');
    assert.equal((await marcar(d, 'presentada')).estado, 'presentada');
    await subir(d, 'comprobante_pago');
    const pagada = await marcar(d, 'pagada');
    assert.equal(pagada.estado, 'pagada');
    assert.equal(d.documentos.docs[0]?.retenerHasta, '2031-10-08');
  });

  it('refuses presentada without the acuse', async () => {
    await assert.rejects(marcar(deps(), 'presentada'), EvidenciaFaltanteError);
  });

  it('closes «sin pago» with the acuse alone', async () => {
    const d = deps();
    await subir(d, 'acuse');
    await marcar(d, 'presentada');
    const r = await marcar(d, 'pagada', true);
    assert.deepEqual([r.estado, r.sinPago], ['pagada', true]);
  });

  it('refuses a period before the SAT registration, and an exempt template', async () => {
    const d = deps();
    await assert.rejects(
      marcarObligacion(d, {
        plantillaId: 'isr_mensual',
        periodo: '2026-08',
        nuevo: 'presentada',
        sinPago: false,
        founderId: 'f1',
      }),
      ObligacionDesconocidaError,
    );
    await assert.rejects(
      marcarObligacion(d, {
        plantillaId: 'diot',
        periodo: '2026-09',
        nuevo: 'presentada',
        sinPago: false,
        founderId: 'f1',
      }),
      ObligacionExentaError,
    );
  });

  it('refuses a file that is not evidence', async () => {
    const d = deps();
    await assert.rejects(
      subirEvidencia(d, {
        plantillaId: 'isr_mensual',
        periodo: '2026-09',
        tipo: 'acuse',
        nombre: 'x.exe',
        mime: 'application/octet-stream',
        contenido: pdf,
        hoy: '2026-10-08',
        founderId: 'f1',
      }),
      ArchivoInvalidoError,
    );
  });
});

describe('the registration and the one-offs', () => {
  it('stores a past registration and refuses a future one', async () => {
    const d = deps();
    await guardarInscripcion(d.agenda, { fecha: '2026-09-01', hoy: '2026-10-08', founderId: 'f1' });
    assert.equal(d.agenda.inscripcion, '2026-09-01');
    await assert.rejects(
      guardarInscripcion(d.agenda, { fecha: '2026-10-09', hoy: '2026-10-08', founderId: 'f1' }),
      InscripcionFuturaError,
    );
  });

  it('asks a generic trámite for its title, and refuses a bad date or a recurring template', async () => {
    const a = new FakeAgenda();
    const base = { plantillaId: 'tramite', fecha: '2026-11-07', titulo: ' ', founderId: 'f1' };
    await assert.rejects(agregarVencimiento(a, base), ConceptoRequeridoError);
    await assert.rejects(
      agregarVencimiento(a, { ...base, titulo: 'Marca', fecha: '2026-02-30' }),
      FechaInvalidaError,
    );
    await assert.rejects(
      agregarVencimiento(a, { ...base, plantillaId: 'isr_mensual', titulo: 'x' }),
      ObligacionDesconocidaError,
    );
  });
});
