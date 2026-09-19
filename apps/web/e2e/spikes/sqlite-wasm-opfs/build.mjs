/**
 * Bundles the O-02 spike entry with the sql.js WASM binary inlined as a
 * base64 payload (Playwright's route.fulfill corrupts binary bodies in
 * WebKit). One self-contained IIFE, measurable for the spike's record.
 */

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Resolves sql.js's browser WASM binary regardless of pnpm's layout. */
function wasmBinaryPlugin() {
  return {
    name: 'wasm-binary',
    setup(build) {
      build.onResolve({ filter: /sql-wasm-browser\.wasm\?binary$/ }, () => ({
        path: require.resolve('sql.js/dist/sql-wasm-browser.wasm', {
          paths: [resolve(HERE, '../../../')],
        }),
        namespace: 'wasm-binary',
      }));
      build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => {
        const b64 = readFileSync(args.path).toString('base64');
        return {
          contents:
            'const b64 = ' +
            JSON.stringify(b64) +
            ';\nconst bin = atob(b64);\nconst bytes = new Uint8Array(bin.length);\n' +
            'for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);\n' +
            'export default bytes;',
          loader: 'js',
        };
      });
    },
  };
}

export async function buildSpike() {
  await build({
    entryPoints: [resolve(HERE, 'entry.ts')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    outfile: resolve(HERE, '.out/spike.js'),
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [wasmBinaryPlugin()],
    logLevel: 'error',
  });
  return resolve(HERE, '.out/spike.js');
}
