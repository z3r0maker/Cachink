import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  RfcMexiaPendienteError,
  SinArchivosError,
  subirFacturas,
  type ArchivoXml,
} from '../../src/corp/index.js';
import { cfdiXml, RFC_MEXIA_PRUEBA, type CfdiDePrueba } from './cfdi-xml.js';
import { FakeFacturas, FakeSat } from './fake-facturas.js';

/** E-11, board CD-06c: what an upload keeps and what it sets aside. */
const archivo = (nombre: string, o: CfdiDePrueba = {}): ArchivoXml => {
  const texto = cfdiXml(o);
  return { nombre, texto, contenido: new TextEncoder().encode(texto) };
};

const deps = (rfc: string | null = RFC_MEXIA_PRUEBA) => {
  const d = { facturas: new FakeFacturas(), sat: new FakeSat(), rfcMexia: async () => rfc };
  return d;
};
const A = 'AAAAAAAA-0000-4000-8000-000000000001';
const B = 'BBBBBBBB-0000-4000-8000-000000000002';

describe('subirFacturas (E-11)', () => {
  it('keeps each invoice to MEXIA that the SAT finds valid, waiting for review', async () => {
    const d = deps();
    const r = await subirFacturas(d, {
      archivos: [archivo('contador.xml', { uuid: A }), archivo('coworking.xml', { uuid: B })],
      founderId: 'f1',
    });
    assert.deepEqual(r, { listas: [A, B], rechazos: [] });
    assert.equal((await d.facturas.porRevisar()).length, 2);
    assert.equal((await d.facturas.porUuid(A))?.estadoSat, 'vigente');
    assert.match(
      new TextDecoder().decode((await d.facturas.xmlDe(A)) ?? undefined),
      /TimbreFiscalDigital/,
    );
  });

  it('sets aside an invoice to another RFC without asking the SAT («No es de MEXIA»)', async () => {
    const d = deps();
    const r = await subirFacturas(d, {
      archivos: [archivo('papeleria.xml', { uuid: A, receptor: 'OTR010101AA1' })],
      founderId: 'f1',
    });
    assert.equal(r.rechazos[0]?.motivo, 'otro_rfc');
    assert.equal(r.rechazos[0]?.proveedor, 'ANA LÓPEZ MARTÍNEZ');
    assert.deepEqual(d.sat.preguntas, []);
    assert.equal(await d.facturas.porUuid(A), null);
  });

  it('keeps a cancelled invoice flagged, posting nothing, and refuses one the SAT cannot find', async () => {
    const d = deps();
    d.sat.respuestas.set(A, 'cancelado');
    d.sat.respuestas.set(B, 'no_encontrado');
    const r = await subirFacturas(d, {
      archivos: [archivo('a.xml', { uuid: A }), archivo('b.xml', { uuid: B })],
      founderId: 'f1',
    });
    assert.deepEqual(
      r.rechazos.map((x) => x.motivo),
      ['cancelada', 'no_encontrada'],
    );
    assert.equal((await d.facturas.porUuid(A))?.estado, 'cancelada');
    assert.equal(await d.facturas.porUuid(B), null);
  });

  it('refuses a UUID already registered, pointing at its movement, and one repeated in the upload', async () => {
    const d = deps();
    await subirFacturas(d, { archivos: [archivo('a.xml', { uuid: A })], founderId: 'f1' });
    await d.facturas.marcarRegistrada(A, {
      categoria: 'administracion',
      projectId: null,
      entryId: 'e9',
    });
    const r = await subirFacturas(d, {
      archivos: [
        archivo('a-otra-vez.xml', { uuid: A }),
        archivo('b.xml', { uuid: B }),
        archivo('b2.xml', { uuid: B }),
      ],
      founderId: 'f1',
    });
    assert.deepEqual(r.listas, [B]);
    assert.deepEqual(
      r.rechazos.map((x) => [x.archivo, x.motivo, x.entryId]),
      [
        ['a-otra-vez.xml', 'ya_registrada', 'e9'],
        ['b2.xml', 'repetida', null],
      ],
    );
  });

  it('reads a file that is not a CFDI as such, and goes on unverified when the SAT does not answer', async () => {
    const d = deps();
    d.sat.respuestas.set(A, 'sin_respuesta');
    const r = await subirFacturas(d, {
      archivos: [
        { nombre: 'foto.png', contenido: new Uint8Array([0x89, 0x50]), texto: '\uFFFDPNG' },
        archivo('a.xml', { uuid: A }),
      ],
      founderId: 'f1',
    });
    assert.equal(r.rechazos[0]?.motivo, 'no_es_cfdi');
    assert.deepEqual(r.listas, [A]);
    assert.equal((await d.facturas.porUuid(A))?.estadoSat, 'sin_verificar');
  });

  it('needs MEXIA’s RFC, and between 1 and 25 files', async () => {
    await assert.rejects(
      subirFacturas(deps(null), { archivos: [archivo('a.xml')], founderId: 'f1' }),
      RfcMexiaPendienteError,
    );
    await assert.rejects(
      subirFacturas(deps(), { archivos: [], founderId: 'f1' }),
      SinArchivosError,
    );
    const muchos = Array.from({ length: 26 }, (_, i) => archivo(`${i}.xml`));
    await assert.rejects(
      subirFacturas(deps(), { archivos: muchos, founderId: 'f1' }),
      SinArchivosError,
    );
  });
});
