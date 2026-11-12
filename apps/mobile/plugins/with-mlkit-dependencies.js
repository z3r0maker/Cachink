/**
 * Expo config plugin: the ML Kit models a store install downloads with the
 * app, declared once in the app's own AndroidManifest (ADR-134).
 *
 * `com.google.mlkit.vision.DEPENDENCIES` is one meta-data entry per app. The
 * `subject-lift` module needs `subject_segment`, and the dev client's launcher
 * declares `barcode_ui` in debug builds, so two library manifests carrying it
 * fail the debug merge («Manifest merger failed»). The app manifest outranks
 * every library, and `tools:replace` makes its value the one that ships.
 */

const { withAndroidManifest } = require('expo/config-plugins');

const NAME = 'com.google.mlkit.vision.DEPENDENCIES';
const MODELS = 'subject_segment';
const TOOLS_NS = 'http://schemas.android.com/tools';

function declareMlkitDependencies(androidManifest) {
  const manifest = androidManifest.manifest;
  manifest.$ = { ...manifest.$, 'xmlns:tools': TOOLS_NS };
  const app = manifest.application?.[0];
  if (!app) throw new Error('with-mlkit-dependencies: <application> not found in AndroidManifest');
  const others = (app['meta-data'] ?? []).filter((m) => m.$['android:name'] !== NAME);
  app['meta-data'] = [
    ...others,
    { $: { 'android:name': NAME, 'android:value': MODELS, 'tools:replace': 'android:value' } },
  ];
  return androidManifest;
}

module.exports = function withMlkitDependencies(config) {
  return withAndroidManifest(config, (cfg) => {
    cfg.modResults = declareMlkitDependencies(cfg.modResults);
    return cfg;
  });
};

module.exports.declareMlkitDependencies = declareMlkitDependencies;
