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
    readonly version?: string;
    readonly ios?: { readonly bundleIdentifier?: string };
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

  it('is a 1.x release of the bundle App Store Connect holds', () => {
    assert.match(app.expo.version ?? '', /^[1-9]\d*\.\d+\.\d+$/);
    assert.equal(app.expo.ios?.bundleIdentifier, 'mx.xangarro.mobile');
  });
});

describe('eas.json', () => {
  it('submits iOS builds to the Xangarro record in App Store Connect', () => {
    const eas = JSON.parse(readFileSync(resolve(import.meta.dirname, '../eas.json'), 'utf8')) as {
      readonly submit: {
        readonly production: {
          readonly ios: { readonly ascAppId?: string; readonly appleTeamId?: string };
        };
      };
    };
    assert.equal(eas.submit.production.ios.ascAppId, '6836591900');
    assert.equal(eas.submit.production.ios.appleTeamId, '25T7H2DCB3');
  });
});
