import { beforeEach, describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  RefrescarLogoNegocioUseCase,
  type LogoCache,
  type LogoDescarga,
  type LogoGuardado,
  type RespuestaLogo,
} from '../src/index.js';

/**
 * The business logo cached on the phone for offline receipts (N-19): one
 * download per change, keyed by the bytes' ETag; the copy held survives a
 * failed download, and a removed logo clears it.
 */

const URL_LOGO = 'https://app.xangarro.mx/api/logos/01HZ8XQN9GZJXV8AKQ5X0BNS01';
const PNG = Buffer.from('png-bytes').toString('base64');
const PNG_NUEVO = Buffer.from('png-bytes-nuevos').toString('base64');

class CacheEnMemoria implements LogoCache {
  guardado: LogoGuardado | null = null;
  escrituras = 0;
  async leer(): Promise<LogoGuardado | null> {
    return this.guardado;
  }
  async guardar(logo: LogoGuardado): Promise<void> {
    this.escrituras += 1;
    this.guardado = logo;
  }
  async borrar(): Promise<void> {
    this.guardado = null;
  }
}

class DescargaFalsa implements LogoDescarga {
  llamadas: { url: string; etagPrevio: string | null }[] = [];
  constructor(private responder: () => Promise<RespuestaLogo>) {}
  async descargar(url: string, etagPrevio: string | null): Promise<RespuestaLogo> {
    this.llamadas.push({ url, etagPrevio });
    return this.responder();
  }
}

const nuevo =
  (etag: string, base64 = PNG, mime = 'image/png'): (() => Promise<RespuestaLogo>) =>
  async () => ({ cambio: true, etag, mime, base64 });

const guardado = (over: Partial<LogoGuardado> = {}): LogoGuardado => ({
  url: URL_LOGO,
  etag: '"etag-uno"',
  revision: '2026-11-01T10:00:00.000Z',
  mime: 'image/png',
  base64: PNG,
  ...over,
});

describe('RefrescarLogoNegocioUseCase (N-19)', () => {
  let cache: CacheEnMemoria;

  beforeEach(() => {
    cache = new CacheEnMemoria();
  });

  it('downloads a logo the phone does not hold yet and caches it under its ETag', async () => {
    const descarga = new DescargaFalsa(nuevo('"etag-uno"'));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-01T10:00:00.000Z',
    });
    assert.equal(r.estado, 'descargado');
    assert.deepEqual(descarga.llamadas, [{ url: URL_LOGO, etagPrevio: null }]);
    assert.deepEqual(cache.guardado, guardado());
    assert.deepEqual(r.logo, guardado());
  });

  it('does not touch the network while the business row has not changed', async () => {
    cache.guardado = guardado();
    const descarga = new DescargaFalsa(nuevo('"etag-dos"', PNG_NUEVO));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-01T10:00:00.000Z',
    });
    assert.equal(r.estado, 'vigente');
    assert.equal(descarga.llamadas.length, 0);
    assert.equal(cache.escrituras, 0);
    assert.deepEqual(r.logo, guardado());
  });

  it('revalidates with the ETag held when the row changed, and keeps the bytes on a 304', async () => {
    cache.guardado = guardado();
    const descarga = new DescargaFalsa(async () => ({ cambio: false }));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-05T09:00:00.000Z',
    });
    assert.equal(r.estado, 'sin-cambio');
    assert.deepEqual(descarga.llamadas, [{ url: URL_LOGO, etagPrevio: '"etag-uno"' }]);
    assert.deepEqual(cache.guardado, guardado({ revision: '2026-11-05T09:00:00.000Z' }));
  });

  it('treats the same ETag sent back in full as no change', async () => {
    cache.guardado = guardado();
    const descarga = new DescargaFalsa(nuevo('"etag-uno"', PNG_NUEVO));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-05T09:00:00.000Z',
    });
    assert.equal(r.estado, 'sin-cambio');
    assert.equal(cache.guardado?.base64, PNG);
  });

  it('replaces the copy when the owner uploaded a new logo', async () => {
    cache.guardado = guardado();
    const descarga = new DescargaFalsa(nuevo('"etag-dos"', PNG_NUEVO));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-05T09:00:00.000Z',
    });
    assert.equal(r.estado, 'descargado');
    assert.deepEqual(
      cache.guardado,
      guardado({ etag: '"etag-dos"', base64: PNG_NUEVO, revision: '2026-11-05T09:00:00.000Z' }),
    );
  });

  it('keeps the copy it holds when the download fails, offline included', async () => {
    cache.guardado = guardado();
    const sinRed = new Error('Network request failed');
    const descarga = new DescargaFalsa(async () => Promise.reject(sinRed));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-05T09:00:00.000Z',
    });
    assert.equal(r.estado, 'fallo');
    assert.equal(r.error, sinRed);
    assert.deepEqual(r.logo, guardado());
    assert.deepEqual(cache.guardado, guardado());
    assert.equal(cache.escrituras, 0);
  });

  it('has no logo to show when the first download fails', async () => {
    const descarga = new DescargaFalsa(async () => Promise.reject(new Error('offline')));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: 'r1',
    });
    assert.equal(r.estado, 'fallo');
    assert.equal(r.logo, null);
    assert.equal(cache.guardado, null);
  });

  it('refuses bytes that are not a logo and keeps the copy it holds', async () => {
    cache.guardado = guardado();
    const html = Buffer.from('<html>captive portal</html>').toString('base64');
    const descarga = new DescargaFalsa(nuevo('"etag-portal"', html, 'text/html'));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: 'r2',
    });
    assert.equal(r.estado, 'fallo');
    assert.deepEqual(cache.guardado, guardado());
    assert.deepEqual(r.logo, guardado());
  });

  it('clears the copy when the owner removed the logo, without a download', async () => {
    cache.guardado = guardado();
    const descarga = new DescargaFalsa(nuevo('"etag-dos"'));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: null,
      revision: 'r3',
    });
    assert.equal(r.estado, 'sin-logo');
    assert.equal(r.logo, null);
    assert.equal(cache.guardado, null);
    assert.equal(descarga.llamadas.length, 0);
  });

  it('never shows a logo cached for another URL when the download fails', async () => {
    cache.guardado = guardado({ url: 'https://app.xangarro.mx/api/logos/OTRO' });
    const descarga = new DescargaFalsa(async () => Promise.reject(new Error('offline')));
    const r = await new RefrescarLogoNegocioUseCase(cache, descarga).execute({
      logoUrl: URL_LOGO,
      revision: '2026-11-01T10:00:00.000Z',
    });
    assert.equal(r.estado, 'fallo');
    assert.equal(r.logo, null);
    assert.deepEqual(descarga.llamadas, [{ url: URL_LOGO, etagPrevio: null }]);
  });
});
