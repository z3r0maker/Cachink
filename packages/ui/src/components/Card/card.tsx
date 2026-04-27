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
 * Foreground color is **not** inferred for the `black` variant: consumers
 * pass dark-on-light children for white/yellow and explicitly set their
 * children's text color when rendering inside a black Card. Keeps Card
 * agnostic of its content and avoids a context (premature for Phase 1A).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows.
 */
import type { ReactElement, ReactNode } from 'react';
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

interface VariantStyle {
  readonly background: string;
  readonly borderWidth: number;
  readonly shadow: string;
}

const VARIANTS: Record<CardVariant, VariantStyle> = {
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
const PRESSED_STYLE = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

/**
 * Renders the canonical Cachink card surface. See `card.stories.tsx` for the
 * full variant catalog.
 */
export function Card(props: CardProps): ReactElement {
  const variant = props.variant ?? 'white';
  const padding = props.padding ?? 'md';
  const v = VARIANTS[variant];
  const tappable = props.onPress !== undefined;

  return (
    <View
      testID={props.testID ?? 'card'}
      onPress={props.onPress}
      pressStyle={tappable ? PRESSED_STYLE : {}}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={v.borderWidth}
      borderRadius={CARD_RADIUS}
      padding={PADDINGS[padding]}
      width={props.fullWidth === true ? '100%' : undefined}
      cursor={tappable ? 'pointer' : 'default'}
      role={tappable ? 'button' : undefined}
      aria-label={tappable ? props.ariaLabel : undefined}
      style={{ boxShadow: v.shadow, userSelect: 'none' }}
    >
      {props.children}
    </View>
  );
}
