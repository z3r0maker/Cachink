/**
 * The third-party notices the phone app carries inside its bundle (decided
 * with the owner 2026-11-20: no screen, a file). Every licence's own text
 * with its copyright line, once per distinct text, with the packages under
 * it; and the committed file must match today's production tree.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  AVISOS_PATH,
  collectPackages,
  esDelAnfitrion,
  renderNotices,
  type Paquete,
} from './third-party-notices';

const MIT_A = 'MIT License\n\nCopyright (c) Meta Platforms, Inc.\n\nPermission is hereby granted…';
const MIT_B = 'MIT License\n\nCopyright (c) 2015 Colin McDonnell\n\nPermission is hereby granted…';

const P = (name: string, version: string, license: string, texto: string | null): Paquete => ({
  name,
  version,
  license,
  texto,
});

describe('renderNotices', () => {
  it('says what the file is, then each distinct licence text once with its packages', () => {
    const out = renderNotices([
      P('react', '19.2.6', 'MIT', MIT_A),
      P('react-dom', '19.2.6', 'MIT', MIT_A),
      P('zod', '4.6.7', 'MIT', MIT_B),
    ]);
    expect(out.startsWith('Avisos de software de terceros')).toBe(true);
    expect(out.split(MIT_A).length - 1).toBe(1);
    expect(out).toContain('react 19.2.6\nreact-dom 19.2.6');
    expect(out).toContain('zod 4.6.7');
    expect(out).toContain(MIT_B);
  });

  it('keeps every copyright line: two MIT texts with different owners stay apart', () => {
    const out = renderNotices([P('a', '1.0.0', 'MIT', MIT_A), P('b', '1.0.0', 'MIT', MIT_B)]);
    expect(out).toContain('Meta Platforms');
    expect(out).toContain('Colin McDonnell');
  });

  it('a package without a licence file still says its licence by name', () => {
    const out = renderNotices([P('buffers', '0.1.1', 'Unknown', null)]);
    expect(out).toContain('buffers 0.1.1');
    expect(out).toContain('Licencia declarada: Unknown (el paquete no trae archivo de licencia).');
  });

  it('is stable: the same packages in any order give the same file', () => {
    const xs = [P('b', '1.0.0', 'MIT', MIT_B), P('a', '1.0.0', 'MIT', MIT_A)];
    expect(renderNotices(xs)).toBe(renderNotices([...xs].reverse()));
  });
});

describe('esDelAnfitrion', () => {
  it('keeps a package that runs wherever the app runs', () => {
    expect(esDelAnfitrion({ name: 'react' })).toBe(false);
  });

  it('drops a binary for the machine that builds the app', () => {
    expect(esDelAnfitrion({ name: 'fsevents', os: ['darwin'] })).toBe(true);
    expect(esDelAnfitrion({ name: '@sentry/cli-linux-x64', os: ['linux'], cpu: ['x64'] })).toBe(
      true,
    );
  });

  it('drops one that names only a cpu', () => {
    expect(esDelAnfitrion({ name: '@img/sharp-wasm32', cpu: ['wasm32'] })).toBe(true);
  });

  it('keeps one whose os or cpu list is empty, which restricts nothing', () => {
    expect(esDelAnfitrion({ name: 'x', os: [], cpu: [] })).toBe(false);
  });

  it('keeps one with a malformed field rather than guess', () => {
    expect(esDelAnfitrion({ name: 'x', os: 'darwin' })).toBe(false);
  });
});

describe('the committed file', () => {
  it('names no host-only binary, so a Mac and the Linux CI write the same file', () => {
    const actual = readFileSync(AVISOS_PATH, 'utf8');
    for (const host of ['fsevents ', '@sentry/cli-darwin ', '@sentry/cli-linux-x64 ']) {
      expect(actual).not.toContain(`\n${host}`);
    }
  });

  it('matches the phone app’s production tree (run `pnpm notices` after changing dependencies)', () => {
    const actual = readFileSync(AVISOS_PATH, 'utf8');
    expect(actual).toBe(renderNotices(collectPackages()));
  }, 120_000);
});
