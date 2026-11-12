import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';

/**
 * The ML Kit models a store install downloads with the app live in the app's
 * own manifest (plugins/with-mlkit-dependencies.js, ADR-134): a library entry
 * clashed with the dev client's `barcode_ui` and failed the debug build.
 */

interface MetaData {
  readonly $: Record<string, string>;
}
interface AndroidManifest {
  manifest: {
    $: Record<string, string>;
    application?: { 'meta-data'?: MetaData[] }[];
  };
}

const plugin = createRequire(import.meta.url)('../plugins/with-mlkit-dependencies.js') as {
  declareMlkitDependencies: (m: AndroidManifest) => AndroidManifest;
};

const NAME = 'com.google.mlkit.vision.DEPENDENCIES';

function manifestWith(metaData?: MetaData[]): AndroidManifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      application: [metaData ? { 'meta-data': metaData } : {}],
    },
  };
}

const entriesOf = (m: AndroidManifest): MetaData[] =>
  (m.manifest.application?.[0]?.['meta-data'] ?? []).filter((e) => e.$['android:name'] === NAME);

describe('with-mlkit-dependencies', () => {
  it('declares subject_segment once, replacing any library value', () => {
    const [entry] = entriesOf(plugin.declareMlkitDependencies(manifestWith()));
    assert.equal(entry?.$['android:value'], 'subject_segment');
    assert.equal(entry?.$['tools:replace'], 'android:value');
  });

  it('declares the tools namespace the replace marker needs', () => {
    const out = plugin.declareMlkitDependencies(manifestWith());
    assert.equal(out.manifest.$['xmlns:tools'], 'http://schemas.android.com/tools');
  });

  it('keeps one entry when prebuild runs over a manifest that has it', () => {
    const once = plugin.declareMlkitDependencies(manifestWith());
    assert.equal(entriesOf(plugin.declareMlkitDependencies(once)).length, 1);
  });

  it('leaves the other meta-data alone', () => {
    const other = {
      $: { 'android:name': 'expo.modules.updates.ENABLED', 'android:value': 'true' },
    };
    const out = plugin.declareMlkitDependencies(manifestWith([other]));
    assert.deepEqual(out.manifest.application?.[0]?.['meta-data']?.[0], other);
  });

  it('throws when the manifest has no <application>', () => {
    assert.throws(
      () => plugin.declareMlkitDependencies({ manifest: { $: {} } }),
      /<application> not found/,
    );
  });

  it('is listed in app.json, so prebuild runs it', () => {
    const app = JSON.parse(readFileSync(resolve(import.meta.dirname, '../app.json'), 'utf8')) as {
      expo: { plugins: unknown[] };
    };
    assert.ok(app.expo.plugins.includes('./plugins/with-mlkit-dependencies.js'));
  });
});
