/**
 * The voice is made by a model the owner runs locally behind oMLX (ADR-163,
 * G-07). These hold what oMLX is asked for and what happens when it answers
 * badly, against a small server of the test's own: no model is needed.
 */

import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, it } from 'vitest';

import { MODELOS, decir, pedirLinea, pedirMuestra } from './guias-voz-omlx.js';

const VOZ = { idioma: 'Spanish', descripcion: 'A warm shopkeeper.', muestra: 'Soy Don Cuentas.' };

describe('what oMLX is asked for', () => {
  it('designs the voice from its description, saying the sample’s words', () => {
    assert.deepEqual(pedirMuestra(VOZ), {
      model: MODELOS.diseno,
      input: 'Soy Don Cuentas.',
      language: 'Spanish',
      instructions: 'A warm shopkeeper.',
      response_format: 'wav',
    });
  });

  it('says a line in the sample’s voice: the sample as base64, with its words beside it', () => {
    const pedido = pedirLinea('Toca Cobrar.', VOZ, Buffer.from('RIFF'));
    assert.deepEqual(pedido, {
      model: MODELOS.base,
      input: 'Toca Cobrar.',
      language: 'Spanish',
      ref_audio: 'UklGRg==',
      ref_text: 'Soy Don Cuentas.',
      response_format: 'wav',
    });
  });
});

type Handler = (req: IncomingMessage, res: ServerResponse, body: string) => void;

describe('decir: one request to oMLX', () => {
  let server: Server | undefined;
  afterEach(() => server?.close());

  /** A server that answers every request with `handler`; resolves to its address. */
  const serve = (handler: Handler): Promise<string> =>
    new Promise((resolve) => {
      server = createServer((req, res) => {
        let body = '';
        req.on('data', (chunk: Buffer) => (body += chunk.toString()));
        req.on('end', () => handler(req, res, body));
      });
      server.listen(0, '127.0.0.1', () => {
        resolve(`http://127.0.0.1:${(server?.address() as AddressInfo).port}`);
      });
    });

  it('returns the audio oMLX answers with, and posts the request as JSON', async () => {
    let seen = { url: '', body: '' };
    const url = await serve((req, res, body) => {
      seen = { url: req.url ?? '', body };
      res.writeHead(200, { 'content-type': 'audio/wav' }).end(Buffer.from('RIFFdata'));
    });
    const audio = await decir({ url }, pedirMuestra(VOZ));
    assert.equal(audio.toString(), 'RIFFdata');
    assert.equal(seen.url, '/v1/audio/speech');
    assert.equal((JSON.parse(seen.body) as { model: string }).model, MODELOS.diseno);
  });

  it('sends the key when there is one and no header when there is none', async () => {
    const headers: (string | undefined)[] = [];
    const url = await serve((req, res) => {
      headers.push(req.headers.authorization);
      res.writeHead(200, { 'content-type': 'audio/wav' }).end('x');
    });
    await decir({ url, clave: 'una-clave' }, pedirMuestra(VOZ));
    await decir({ url }, pedirMuestra(VOZ));
    assert.deepEqual(headers, ['Bearer una-clave', undefined]);
  });

  it('repeats oMLX’s own reason when it refuses', async () => {
    const url = await serve((_req, res) => {
      const error = { message: "Invalid base64 encoding in 'ref_audio' field" };
      res.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error }));
    });
    await assert.rejects(decir({ url }, pedirMuestra(VOZ)), /400.*Invalid base64 encoding/);
  });

  it('says so when the model is not one oMLX has', async () => {
    const url = await serve((_req, res) => {
      res
        .writeHead(404, { 'content-type': 'application/json' })
        .end('{"detail":"Model not found"}');
    });
    await assert.rejects(decir({ url }, pedirMuestra(VOZ)), /404.*Model not found/);
  });

  it('refuses an answer that is not audio', async () => {
    const url = await serve((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html' }).end('<html></html>');
    });
    await assert.rejects(decir({ url }, pedirMuestra(VOZ)), /not audio/);
  });

  it('says oMLX is not running when nothing answers at its address', async () => {
    const url = await serve((_req, res) => res.end());
    server?.close();
    await assert.rejects(decir({ url }, pedirMuestra(VOZ)), /did not answer.*127\.0\.0\.1/);
  });
});
