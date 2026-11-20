import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import { describe, it } from 'vitest';

/**
 * The register's SQLite engine comes in two halves that must be one release:
 * the JS glue, bundled from `sql.js`'s browser entry, and the WASM binary,
 * served from `public/sql-wasm.wasm` (`db.worker.ts`'s `WASM_URL`). B2 bumped
 * sql.js to 1.16.0 and left the 1.14 binary in `public/`; the 1.16 glue threw
 * «tx is not a function» while starting, and no register could link. A bump
 * that does not copy the binary fails here, before it ships.
 */
const require = createRequire(import.meta.url);
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

/** The binary sql.js's browser entry (`dist/sql-wasm-browser.js`) is built against. */
const PACKAGE_WASM = require.resolve('sql.js/dist/sql-wasm-browser.wasm');
const SERVED_WASM = join(import.meta.dirname, '../public/sql-wasm.wasm');
/** sql.js does not export its package.json; it sits one folder above `dist/`. */
const SQL_JS_VERSION = (
  JSON.parse(readFileSync(join(dirname(PACKAGE_WASM), '../package.json'), 'utf8')) as {
    version: string;
  }
).version;

describe('public/sql-wasm.wasm', () => {
  it(`is the binary of the installed sql.js (${SQL_JS_VERSION})`, () => {
    assert.equal(
      sha256(SERVED_WASM),
      sha256(PACKAGE_WASM),
      `public/sql-wasm.wasm is not sql.js ${SQL_JS_VERSION}'s binary: ` +
        'copy node_modules/sql.js/dist/sql-wasm-browser.wasm over it',
    );
  });
});
