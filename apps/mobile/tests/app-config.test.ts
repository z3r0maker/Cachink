import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';

/**
 * What the native projects are generated from (`app.json`), where it bears
 * on the data kept on the phone (audit F-15e).
 */

interface AppJson {
  readonly expo: {
    readonly android?: { readonly allowBackup?: boolean };
    readonly updates?: { readonly url?: string };
  };
}

const app = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../app.json'), 'utf8'),
) as AppJson;

describe('app.json', () => {
  it('keeps the ledger and the NIP hashes out of Android backups', () => {
    // `android:allowBackup="false"`: no Google Drive backup, no `adb backup`.
    assert.equal(app.expo.android?.allowBackup, false);
  });
});
