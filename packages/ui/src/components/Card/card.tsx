/**
 * Card — the Cachink container primitive.
 *
 * Three variants from CLAUDE.md §8.4 (`white` / `yellow` / `black`) wrap any
 * child content with the brand's hard 2px / 2.5px black border, hard drop
 * shadow, and 14-radius corners — the §8.3 neobrutalist signature. Every
 * Phase 1C screen composes Cards (lists, KPIs, hero metrics, Director Home
 * cards), so this is the foundational surface primitive that downstream
 * primitives (Kpi, Gauge) render inside.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * When `onPress` is provided the Card becomes tappable and inherits Btn's
 * press transform (translate 2px + shrink shadow to 1×1) — the same tactile
 * stamp feel from §8.3. When omitted the Card is inert (no cursor, no
 * pressStyle).
 *
 * ## Same fix as Btn (F0-T04) — `<Pressable>` over `<View onPress>`
 *
 * Tappable cards now render a RN `<Pressable>` root so Maestro / XCUI
 * synthetic taps fire the handler. Inert cards (no `onPress`) still render
 * a Tamagui `<View>` for styling convenience. See Btn's doc block for
 * the full rationale on why Tamagui `<View onPress>` fails under E2E.
 *
 * Foreground color is **not** inferred for the `black` variant: consumers
 * pass dark-on-light children for white/yellow and explicitly set their
 * children's text color when rendering inside a black Card. Keeps Card
 * agnostic of its content and avoids a context (premature for Phase 1A).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { colors, radii, shadows } from '../../theme';

export type CardVariant = 'white' | 'yellow' | 'black';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Surface variant from CLAUDE.md §8.4. Defaults to `white`. */
  readonly variant?: CardVariant;
  /** Inner padding scale. Defaults to `md` (16). */
  readonly padding?: CardPadding;
  /**
   * When provided the Card becomes tappable and applies the §8.3 press
   * transform. When omitted no press handler is wired and no cursor is set.
   */
  readonly onPress?: () => void;
  /** If true, stretches to 100% of the parent's width. */
  readonly fullWidth?: boolean;
  /** Card content — any ReactNode. Consumers own typography + color. */
  readonly children: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Screen-reader label — applied when the Card is tappable. Forwarded
   * to Tamagui's `aria-label` per ADR-034 (Tamagui 2.x no longer
   * translates RN-style a11y props; consumers pass web-standard ones).
   */
  readonly ariaLabel?: string;
}

interface VariantDef {
  readonly background: string;
  readonly borderWidth: number;
  readonly shadow: string;
}

const VARIANTS: Record<CardVariant, VariantDef> = {
  white: { background: colors.white, borderWidth: 2, shadow: shadows.card },
  yellow: { background: colors.yellow, borderWidth: 2, shadow: shadows.card },
  black: { background: colors.black, borderWidth: 2.5, shadow: shadows.hero },
};

const PADDINGS: Record<CardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

/** Card radius — 14 from the §8.3 scale, one step above Btn's 10. */
const CARD_RADIUS = radii[3];

/** Per CLAUDE.md §8.3: on press, shift 2px and shrink shadow to 1×1. */
const PRESS_TRANSFORM: ViewStyle = {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  boxShadow: shadows.pressed,
};

/** Builds the RN ViewStyle for a tappable (Pressable) card root. */
function buildTappableStyle(v: VariantDef, pad: number, fullWidth: boolean): ViewStyle {
  return {
    backgroundColor: v.background,
    borderColor: colors.black,
    borderWidth: v.borderWidth,
    borderRadius: CARD_RADIUS,
    padding: pad,
    width: fullWidth ? '100%' : undefined,
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: v.shadow,
  } as ViewStyle;
}

/**
 * Renders the canonical Cachink card surface. See `card.stories.tsx` for the
 * full variant catalog.
 */
export function Card(props: CardProps): ReactElement {
  const variant = props.variant ?? 'white';
  const padding = props.padding ?? 'md';
  const v = VARIANTS[variant];
  const pad = PADDINGS[padding];
  const tappable = props.onPress !== undefined;

  // Tappable cards use RN Pressable for reliable gesture recognition on
  // Maestro / XCUI (same fix as Btn — F0-T04).
  if (tappable) {
    const base = buildTappableStyle(v, pad, props.fullWidth === true);
    return (
      <Pressable
        testID={props.testID ?? 'card'}
        onPress={props.onPress}
        role="button"
        aria-label={props.ariaLabel}
        accessibilityRole="button"
        accessibilityLabel={props.ariaLabel}
        style={({ pressed }) => [base, pressed ? PRESS_TRANSFORM : null]}
      >
        {props.children}
      </Pressable>
    );
  }

  // Inert cards stay on Tamagui View — simpler styling, no gesture needed.
  return (
    <View
      testID={props.testID ?? 'card'}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={v.borderWidth}
      borderRadius={CARD_RADIUS}
      padding={pad}
      width={props.fullWidth === true ? '100%' : undefined}
      style={{ boxShadow: v.shadow, userSelect: 'none' }}
    >
      {props.children}
    </View>
  );
}
