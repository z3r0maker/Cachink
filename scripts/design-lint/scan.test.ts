import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { scanFile } from './scan';

/**
 * Regression tests for the design linter.
 *
 * The cases below are not hypothetical: during the audit that produced this
 * tool, a regex-based first draft reported 24 findings that did not exist. 22
 * came from one mistake — matching `<Btn ... />` non-greedily, so the match
 * terminated at the `/>` closing a *nested* `icon={<Icon />}` and every
 * labelled button looked like an unlabelled icon-only one. The other 2 came
 * from parsing `<Pressable>` inside a JSDoc block. Both shapes are pinned here.
 */

const rules = (src: string): readonly string[] =>
  scanFile('packages/ui/src/screens/Demo/demo.tsx', src).map((f) => f.rule);

describe('a11y/btn-no-children-no-label', () => {
  it('ignores a labelled Btn whose icon prop contains a self-closing element', () => {
    const src = `
      export const A = () => (
        <Btn variant="ghost" icon={<Icon name="pencil" size={16} />} onPress={go}>
          {t('settings.edit')}
        </Btn>
      );`;
    assert.deepEqual(rules(src), []);
  });

  it('flags a genuinely self-closing icon-only Btn', () => {
    const src = `
      export const A = () => (
        <Btn variant="ghost" onPress={del} icon={<Icon name="trash-2" size={16} />} />
      );`;
    assert.deepEqual(rules(src), ['a11y/btn-no-children-no-label']);
  });

  it('accepts a self-closing Btn that supplies ariaLabel', () => {
    const src = `
      export const A = () => (
        <Btn ariaLabel={t('a11y.delete')} onPress={del} icon={<Icon name="trash-2" />} />
      );`;
    assert.deepEqual(rules(src), []);
  });
});

describe('a11y/icon-only-unlabeled', () => {
  it('flags a Pressable wrapping only an Icon', () => {
    const src = `
      export const A = () => (
        <Pressable onPress={onEdit} testID="edit">
          <Icon name="pencil" size={18} />
        </Pressable>
      );`;
    assert.deepEqual(rules(src), ['a11y/icon-only-unlabeled']);
  });

  it('accepts one carrying aria-label', () => {
    const src = `
      export const A = () => (
        <Pressable onPress={onEdit} aria-label={t('a11y.edit')}>
          <Icon name="pencil" size={18} />
        </Pressable>
      );`;
    assert.deepEqual(rules(src), []);
  });

  it('accepts one whose children render text a screen reader can announce', () => {
    const src = `
      export const A = () => (
        <Pressable onPress={onEdit}>
          <Text>{t('common.edit')}</Text>
        </Pressable>
      );`;
    assert.deepEqual(rules(src), []);
  });

  it('does not parse JSX mentioned inside a doc comment', () => {
    const src = `
      /**
       * Rooted on <Pressable> so Maestro taps fire.
       * Previously <Pressable><Icon /></Pressable>.
       */
      export const A = () => <View />;`;
    assert.deepEqual(rules(src), []);
  });
});

describe('token rules', () => {
  it('separates off-palette hexes from inlined theme values', () => {
    // `#FF00FF` has to stay absent from `theme.ts` for this to mean anything.
    // The previous fixture used `#8B5CF6`, which stopped being off-palette the
    // moment that colour was promoted to a token — the rule reads the real
    // theme, so the fixture has to be a colour nobody would ever adopt.
    const src = `const a = '#FF00FF'; const b = '#FFD60A';`;
    assert.deepEqual(rules(src), ['token/hex-offscale', 'token/hex-inline-duplicate']);
  });

  it('accepts radii on the documented ladder and flags those off it', () => {
    assert.deepEqual(rules(`const s = { borderRadius: 10 };`), []);
    assert.deepEqual(rules(`const s = { borderRadius: 9 };`), ['token/radius-offscale']);
  });

  it('treats borderWidth 0 as "no border", not as drift', () => {
    assert.deepEqual(rules(`const s = { borderWidth: 0 };`), []);
    assert.deepEqual(rules(`const s = { borderWidth: 1 };`), ['token/borderwidth-offscale']);
  });

  it('flags blurred shadows, which the brand forbids', () => {
    assert.deepEqual(rules(`<View shadowRadius={10} />`), ['token/soft-shadow']);
  });

  it('exempts the theme source itself from token rules', () => {
    const findings = scanFile('packages/ui/src/theme.ts', `export const c = { x: '#8B5CF6' };`);
    assert.deepEqual([...findings], []);
  });
});

describe('a11y/surface-color-as-text', () => {
  it('flags a surface-only token used to colour glyphs', () => {
    const src = `export const A = () => <Text color={colors.gray400}>hola</Text>;`;
    assert.deepEqual(rules(src), ['a11y/surface-color-as-text']);
  });

  it('flags both arms of a ternary', () => {
    const src = `export const A = () => <Text color={isUp ? colors.green : colors.red}>x</Text>;`;
    assert.deepEqual(rules(src), ['a11y/surface-color-as-text', 'a11y/surface-color-as-text']);
  });

  it('accepts the accessible text pair', () => {
    const src = `export const A = () => <Text color={colors.greenText}>hola</Text>;`;
    assert.deepEqual(rules(src), []);
  });

  it('leaves the same token alone on a fill or border', () => {
    const src = `export const A = () => <View backgroundColor={colors.green} borderColor={colors.red} />;`;
    assert.deepEqual(rules(src), []);
  });
});

describe('token/fontsize-literal', () => {
  it('flags a raw fontSize now that a scale exists', () => {
    assert.deepEqual(rules(`<Text fontSize={14}>hola</Text>`), ['token/fontsize-literal']);
    assert.deepEqual(rules(`const s = { fontSize: 14 };`), ['token/fontsize-literal']);
  });

  it('accepts a scale token', () => {
    assert.deepEqual(rules(`<Text fontSize={typography.sizes.md}>hola</Text>`), []);
  });

  it('accepts the emoji illustration sizes', () => {
    assert.deepEqual(rules(`<Text fontSize={emojiSizes.lg}>🎉</Text>`), []);
  });
});
