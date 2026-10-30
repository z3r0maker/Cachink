import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'vitest';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml } from '@xangarro/testing/corp';

import {
  consultaSat,
  estadoDeRespuesta,
  expresion,
  SAT_URL,
  simulada,
} from '../src/server/empresa/sat-consulta';

/** E-11: the SAT's CFDI status service, and how the console reads its answer. */
const UUID = '6F1C2B3A-4D5E-4F60-8A7B-9C0D1E2F3A4B';
const cfdi = leerCfdi(cfdiXml({ uuid: UUID }));
const respuesta = (estado: string) =>
  '<s:Envelope><s:Body><ConsultaResponse><ConsultaResult>' +
  `<a:CodigoEstatus>S - Comprobante obtenido satisfactoriamente.</a:CodigoEstatus>` +
  `<a:Estado>${estado}</a:Estado></ConsultaResult></ConsultaResponse></s:Body></s:Envelope>`;

const fetchQue = (r: () => Promise<Response>) => {
  const llamadas: { url: string; body: string }[] = [];
  const f = (async (url: string, init: RequestInit) => {
    llamadas.push({ url, body: String(init.body) });
    return r();
  }) as typeof fetch;
  return { f, llamadas };
};

afterEach(() => {
  delete process.env.CORP_SAT_CONSULTA;
});

describe('consultaSat (E-11)', () => {
  it('asks with the RFCs, the total as written, the UUID and the seal, and reads «Vigente»', async () => {
    const { f, llamadas } = fetchQue(async () => new Response(respuesta('Vigente')));
    assert.equal(await consultaSat(f).estado(cfdi), 'vigente');
    assert.equal(llamadas[0]?.url, SAT_URL);
    assert.match(
      llamadas[0]?.body ?? '',
      /<!\[CDATA\[\?re=LOMA800101AB2&rr=MEX261001AB1&tt=3336\.67&id=/,
    );
    assert.equal(expresion(cfdi).endsWith(`id=${UUID}&fe=12AB34CD`), true);
  });

  it('reads «Cancelado» and «No Encontrado»', () => {
    assert.equal(estadoDeRespuesta(respuesta('Cancelado')), 'cancelado');
    assert.equal(estadoDeRespuesta(respuesta('No Encontrado')), 'no_encontrado');
  });

  it('answers «sin_respuesta» when the SAT errs, times out or says something else', async () => {
    const caido = fetchQue(async () => new Response('', { status: 503 }));
    assert.equal(await consultaSat(caido.f).estado(cfdi), 'sin_respuesta');
    const red = fetchQue(async () => {
      throw new TypeError('fetch failed');
    });
    assert.equal(await consultaSat(red.f).estado(cfdi), 'sin_respuesta');
    assert.equal(estadoDeRespuesta('<html>Mantenimiento</html>'), 'sin_respuesta');
  });

  it('simulated for e2e: answers without the network, by the UUID', async () => {
    process.env.CORP_SAT_CONSULTA = 'simulada';
    const { f, llamadas } = fetchQue(async () => new Response(respuesta('Cancelado')));
    assert.equal(await consultaSat(f).estado(cfdi), 'vigente');
    assert.deepEqual(llamadas, []);
    const de = (uuid: string) => simulada(leerCfdi(cfdiXml({ uuid })));
    assert.equal(de('00000000-0000-4000-8000-000000000001'), 'cancelado');
    assert.equal(de('FFFFFFFF-0000-4000-8000-000000000001'), 'no_encontrado');
  });
});
