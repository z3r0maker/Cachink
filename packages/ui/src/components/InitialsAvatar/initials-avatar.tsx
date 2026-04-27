/**
 * InitialsAvatar — yellow rounded-square avatar (ADR-040).
 *
 * Renders 1–3 uppercase initials inside a brand-yellow square with the
 * §8.3 hard 2-px black border and 10-radius rounding. Used as the
 * `left` slot of `<TopBar>` (replaces the legacy RoleChip) and inside
 * modal headers (Nueva Venta, Nueva Egreso) to mirror the design mocks
 * from April 2026.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * When `onPress` is provided the avatar becomes tappable and inherits
 * the §8.3 press transform (translate 2px, shrink shadow to 1×1) so the
 * tap-to-change-role action feels tactile. When omitted the avatar is
 * display-only (no cursor, no shadow).
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export type InitialsAvatarSize = 'sm' | 'md' | 'lg';

export type InitialsAvatarVariant = 'brand' | 'dark';

export interface InitialsAvatarProps {
  /**
   * Free-form source string. The component uppercases it, trims
   * whitespace, and keeps the **first 1–3 characters** so callers can
   * pass the user's name (`'Pedro Espinoza'`), the role
   * (`'director'`), or pre-formatted initials (`'PE'`). Empty / blank
   * strings render a single placeholder dot.
   */
  readonly value: string;
  /** Avatar size. sm=36 / md=44 / lg=52 px. Defaults to `md`. */
  readonly size?: InitialsAvatarSize;
  /**
   * Visual variant. `brand` = yellow background, black text (matches
   * Operativo + Director mocks 1/2/3). `dark` = black background,
   * yellow text (matches the Director role chip in the legacy
   * `RoleChip`). Defaults to `brand`.
   */
  readonly variant?: InitialsAvatarVariant;
  /** When provided, the avatar is tappable and uses the §8.3 press transform. */
  readonly onPress?: () => void;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Screen-reader label. Forwarded to Tamagui's `aria-label` per
   * ADR-034. Falls back to the displayed initials.
   */
  readonly ariaLabel?: string;
}

interface SizeStyle {
  readonly box: number;
  readonly fontSize: number;
}

const SIZES: Record<InitialsAvatarSize, SizeStyle> = {
  sm: { box: 36, fontSize: 12 },
  md: { box: 44, fontSize: 14 },
  lg: { box: 52, fontSize: 16 },
};

interface VariantStyle {
  readonly background: string;
  readonly color: string;
}

const VARIANTS: Record<InitialsAvatarVariant, VariantStyle> = {
  brand: { background: colors.yellow, color: colors.black },
  dark: { background: colors.black, color: colors.yellow },
};

/** Shared with `<Btn>` — 10-radius from the §8.3 scale. */
const AVATAR_RADIUS = radii[1];

const PRESSED_STYLE = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

/**
 * Distill a free-form string into 1–3 visible initials. Whitespace and
 * non-letter characters are skipped; multi-word strings yield up to 3
 * leading letters across the words. Edge cases: empty / blank string →
 * `'·'` placeholder so the avatar never renders empty.
 *
 * **Pre-formatted abbreviations** (entirely uppercase, ≤3 chars) are
 * passed through verbatim — `'DIR'` stays `'DIR'`, `'PE'` stays
 * `'PE'`. This lets callers hand-author role abbreviations without the
 * helper truncating them to 2 chars.
 */
export function distillInitials(input: string): string {
  if (input.trim().length === 0) return '·';
  const tokens = input
    .trim()
    .split(/\s+/u)
    .filter((t) => t.length > 0);
  if (tokens.length === 1) {
    const first = tokens[0]!;
    // Pre-formatted all-uppercase abbreviations (e.g. 'DIR', 'PE'):
    // trust the caller and keep up to 3 chars verbatim.
    if (first === first.toUpperCase() && first.length <= 3) {
      return first;
    }
    // Single-token name like 'Pedro' → 'PE' (matches mock 1/2 avatar).
    return first.slice(0, Math.min(2, first.length)).toUpperCase();
  }
  return tokens
    .slice(0, 3)
    .map((t) => t.charAt(0))
    .join('')
    .toUpperCase();
}

interface InitialsTextProps {
  readonly text: string;
  readonly color: string;
  readonly fontSize: number;
}

function InitialsText(props: InitialsTextProps): ReactElement {
  return (
    <Text
      testID="initials-avatar-text"
      color={props.color}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.extraBold}
      fontSize={props.fontSize}
      letterSpacing={typography.letterSpacing.tight}
      // Audit 9.3 — `distillInitials` already caps at 3 characters,
      // but Dynamic Type can still push the glyphs past the 40-pt
      // avatar frame. The combination of `numberOfLines={1}` +
      // `ellipsizeMode="clip"` keeps the initials inside the box.
      numberOfLines={1}
      ellipsizeMode="clip"
      // Audit 9.4 — the avatar's box is fixed (36 / 44 / 52 px);
      // cap at 1.3× so 3 initials at 16-pt still fit at high
      // Dynamic Type.
      maxFontSizeMultiplier={1.3}
    >
      {props.text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink initials avatar. See
 * `initials-avatar.stories.tsx` for the full variant catalog.
 */
export function InitialsAvatar(props: InitialsAvatarProps): ReactElement {
  const size = props.size ?? 'md';
  const variant = props.variant ?? 'brand';
  const s = SIZES[size];
  const v = VARIANTS[variant];
  const tappable = props.onPress !== undefined;
  const initials = distillInitials(props.value);

  return (
    <View
      testID={props.testID ?? 'initials-avatar'}
      onPress={props.onPress}
      pressStyle={tappable ? PRESSED_STYLE : {}}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={AVATAR_RADIUS}
      width={s.box}
      height={s.box}
      alignItems="center"
      justifyContent="center"
      cursor={tappable ? 'pointer' : 'default'}
      role={tappable ? 'button' : 'img'}
      aria-label={props.ariaLabel ?? initials}
      hitSlop={tappable ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined}
      style={{ boxShadow: tappable ? shadows.small : 'none', userSelect: 'none' }}
    >
      <InitialsText text={initials} color={v.color} fontSize={s.fontSize} />
    </View>
  );
}
