/**
 * Guards the lockfile against being half re-resolved.
 *
 * pnpm writes one snapshot per package version *per set of peers*. The copies
 * may differ in their peers, which is why they exist, but a plain dependency
 * is resolved once per package version, so every copy names the same version
 * of it. On 2026-11-20 a merged lockfile broke that: one copy of `@expo/cli`
 * used `ws` 8.23.0 while its two siblings used 8.20.0, and the same for
 * `expo-router` and `react-native`. `pnpm install --frozen-lockfile` accepts
 * such a file, so CI stayed green; the next session to add any package had
 * pnpm "fix" it, and four unrelated version changes rode along with a feature.
 *
 * So this asserts the invariant itself, on the committed file, with no network.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import { disagreements } from './lockfile-consistency.js';

const ROOT = join(import.meta.dirname, '..');

/** A lockfile small enough to read: `host` has a peer (`react`) and one plain dependency (`leaf`). */
function lockfile(snapshots: string): string {
  return `lockfileVersion: '9.0'

packages:

  host@1.0.0:
    resolution: {integrity: sha512-x}
    peerDependencies:
      react: '*'

  '@scope/host@1.0.0':
    resolution: {integrity: sha512-x}
    peerDependencies:
      react: '*'

  leaf@1.0.0:
    resolution: {integrity: sha512-x}

  leaf@2.0.0:
    resolution: {integrity: sha512-x}

snapshots:

${snapshots}
  leaf@1.0.0: {}

  leaf@2.0.0: {}
`;
}

const copy = (key: string, field: string, leaf: string, react: string): string =>
  `  ${key}:\n    ${field}:\n      leaf: ${leaf}\n      react: ${react}\n\n`;

describe('disagreements: copies of one package version agree on its plain dependencies', () => {
  it('finds nothing when the copies differ only in their peer', () => {
    const text = lockfile(
      copy('host@1.0.0(react@18.0.0)', 'dependencies', '1.0.0', '18.0.0') +
        copy('host@1.0.0(react@19.0.0)', 'dependencies', '1.0.0', '19.0.0'),
    );
    assert.deepEqual(disagreements(text), []);
  });

  it('reports a plain dependency that two copies resolve differently', () => {
    const text = lockfile(
      copy('host@1.0.0(react@18.0.0)', 'dependencies', '1.0.0', '18.0.0') +
        copy('host@1.0.0(react@19.0.0)', 'dependencies', '2.0.0', '19.0.0'),
    );
    assert.deepEqual(disagreements(text), [
      { pkg: 'host@1.0.0', dependency: 'leaf', versions: ['1.0.0', '2.0.0'] },
    ]);
  });

  it('reports it in optional dependencies too', () => {
    const text = lockfile(
      copy('host@1.0.0(react@18.0.0)', 'optionalDependencies', '1.0.0', '18.0.0') +
        copy('host@1.0.0(react@19.0.0)', 'optionalDependencies', '2.0.0', '19.0.0'),
    );
    assert.equal(disagreements(text).length, 1);
  });

  it('reads scoped names, which the lockfile quotes', () => {
    const text = lockfile(
      copy("'@scope/host@1.0.0(react@18.0.0)'", 'dependencies', '1.0.0', '18.0.0') +
        copy("'@scope/host@1.0.0(react@19.0.0)'", 'dependencies', '2.0.0', '19.0.0'),
    );
    assert.deepEqual(disagreements(text), [
      { pkg: '@scope/host@1.0.0', dependency: 'leaf', versions: ['1.0.0', '2.0.0'] },
    ]);
  });

  it('does not mind the same version carrying different peers of its own', () => {
    const text = lockfile(
      copy('host@1.0.0(react@18.0.0)', 'dependencies', '1.0.0(react@18.0.0)', '18.0.0') +
        copy('host@1.0.0(react@19.0.0)', 'dependencies', '1.0.0(react@19.0.0)', '19.0.0'),
    );
    assert.deepEqual(disagreements(text), []);
  });

  it('skips an entry whose key it cannot read rather than charging the one before it', () => {
    const text = lockfile(
      copy('host@1.0.0(react@18.0.0)', 'dependencies', '1.0.0', '18.0.0') +
        copy("'odd@https://codeload.github.com/a/b/tar.gz/abc'", 'dependencies', '2.0.0', '19.0.0'),
    );
    assert.deepEqual(disagreements(text), []);
  });

  it('refuses a file with no snapshots, so a new lockfile format cannot pass by reading nothing', () => {
    assert.throws(() => disagreements("lockfileVersion: '9.0'\n\npackages:\n"), /snapshots/);
    assert.throws(() => disagreements(lockfile('').replace(/ {2}leaf@.*\n/g, '')), /no snapshot/);
  });
});

describe('the committed pnpm-lock.yaml', () => {
  it('has no package version whose copies disagree about a plain dependency', () => {
    const found = disagreements(readFileSync(join(ROOT, 'pnpm-lock.yaml'), 'utf8'));
    const lines = found.map((d) => `  ${d.pkg}: ${d.dependency} -> ${d.versions.join(' vs ')}`);
    assert.equal(
      found.length,
      0,
      'pnpm-lock.yaml is inconsistent: copies of one package version resolve the same plain ' +
        'dependency to different versions.\n' +
        lines.join('\n') +
        '\nThis is what a hand-merged or partly re-resolved lockfile looks like. Take the ' +
        "lockfile from main, re-apply your own change with a plain `pnpm install` at the repo's " +
        'root, and commit that.',
    );
  });
});
