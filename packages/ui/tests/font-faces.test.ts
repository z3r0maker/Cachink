/**
 * The phone's font names. `typography.fontFamily` is a CSS stack, which no
 * native platform resolves: iOS fell back to SF and Android to Roboto. The
 * phone has to name each weight's file as `useFonts` registered it, and these
 * tests pin those names, the Tamagui `face` map that picks one per weight, and
 * that the font package actually ships each file.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, it, vi } from 'vitest';
import * as tokens from '@xangarro/tokens';
import { fontFace, fontFaces, typography } from '../src/theme';
import type * as Theme from '../src/theme';
import { tamaguiConfig } from '../src/tamagui.config';

const NATIVE_NAMES = {
  400: 'PlusJakartaSans_400Regular',
  500: 'PlusJakartaSans_500Medium',
  600: 'PlusJakartaSans_600SemiBold',
  700: 'PlusJakartaSans_700Bold',
  800: 'PlusJakartaSans_800ExtraBold',
  // The family ships 200–800; black snaps to the heaviest file, as on the web.
  900: 'PlusJakartaSans_800ExtraBold',
} as const;

/** The constants `@expo-google-fonts/plus-jakarta-sans` exports, read from its typings. */
function shippedFaces(): Set<string> {
  const fromMobile = createRequire(resolve(__dirname, '../../../apps/mobile/package.json'));
  const pkg = dirname(fromMobile.resolve('@expo-google-fonts/plus-jakarta-sans/package.json'));
  const typings = readFileSync(join(pkg, 'index.d.ts'), 'utf8');
  return new Set(
    [...typings.matchAll(/export (?:declare )?const (\w+)/g)].map((m) => m[1] as string),
  );
}

describe('fontFaces', () => {
  it('names every weight of the ramp after its file', () => {
    assert.deepEqual({ ...fontFaces }, NATIVE_NAMES);
  });

  it('is derived from the token, not restated', () => {
    assert.equal(tokens.typography.fontFamily, "'Plus Jakarta Sans', sans-serif");
    for (const name of Object.values(fontFaces)) assert.match(name, /^PlusJakartaSans_/);
  });

  it('names only files the font package ships, so useFonts can load each', () => {
    const shipped = shippedFaces();
    for (const name of Object.values(fontFaces)) {
      assert.ok(shipped.has(name), `${name} is not exported by the font package`);
    }
  });
});

describe('the Tamagui font', () => {
  const body = tamaguiConfig.fonts.body as unknown as {
    face: Record<string, { normal: { val: string } | string }>;
  };
  const faceOf = (weight: number): string => {
    const normal = body.face[weight]?.normal;
    return typeof normal === 'string' ? normal : (normal?.val ?? '');
  };

  it('maps each weight to its file', () => {
    for (const [weight, name] of Object.entries(NATIVE_NAMES)) {
      assert.equal(faceOf(Number(weight)), name, `weight ${weight}`);
    }
  });

  it('is the same font for headings and body', () => {
    assert.equal(tamaguiConfig.fonts.heading, tamaguiConfig.fonts.body);
  });
});

describe('on the web (Storybook)', () => {
  it('keeps the CSS stack', () => {
    assert.equal(typography.fontFamily, tokens.typography.fontFamily);
  });

  it('fontFace gives the stack and the weight', () => {
    assert.deepEqual(fontFace(700), {
      fontFamily: tokens.typography.fontFamily,
      fontWeight: '700',
    });
  });
});

describe('on the phone', () => {
  afterEach(() => {
    vi.doUnmock('@tamagui/core');
    vi.resetModules();
  });

  async function nativeTheme(): Promise<typeof Theme> {
    vi.resetModules();
    vi.doMock('@tamagui/core', async (load) => ({ ...(await load<object>()), isWeb: false }));
    return import('../src/theme');
  }

  it('typography.fontFamily is the regular file, the face for text with no weight', async () => {
    const native = await nativeTheme();
    assert.equal(native.typography.fontFamily, 'PlusJakartaSans_400Regular');
  });

  it('fontFace gives the weight file and no fontWeight, which Android would misread', async () => {
    const native = await nativeTheme();
    assert.deepEqual(native.fontFace(600), { fontFamily: 'PlusJakartaSans_600SemiBold' });
    assert.deepEqual(native.fontFace(900), { fontFamily: 'PlusJakartaSans_800ExtraBold' });
  });
});
