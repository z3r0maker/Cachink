/**
 * Real Skia in Node for the photo encoder's tests: CanvasKit (the WASM
 * build react-native-skia's web backend runs on) wrapped in the same
 * `JsiSkApi` the web build uses, so `encodeProductPhoto` sees the very
 * `Skia` interface it gets on the phone.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { SkiaApi } from '../../src/foto-producto/encode';

const require = createRequire(import.meta.url);

type CanvasKitInit = (opts: { locateFile: (f: string) => string }) => Promise<unknown>;

let skia: Promise<SkiaApi> | null = null;

export function loadSkia(): Promise<SkiaApi> {
  if (skia !== null) return skia;
  const ckPath = require.resolve('canvaskit-wasm/bin/full/canvaskit.js');
  const init = require(ckPath) as CanvasKitInit;
  const { JsiSkApi } = require('@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js') as {
    JsiSkApi: (ck: unknown) => SkiaApi;
  };
  skia = init({ locateFile: (f) => join(dirname(ckPath), f) }).then((ck) => JsiSkApi(ck));
  return skia;
}
