/**
 * Btn — the Cachink primary button primitive.
 *
 * Implements the 6 variants from CLAUDE.md §8.4 (primary / dark / ghost /
 * green / danger / soft) with the hard-border + hard-drop-shadow +
 * press-transform interaction that defines the neobrutalist brand feel
 * described in §8.3.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii, no soft shadows. This is the reference pattern every
 * remaining Phase 1A primitive (Input, Tag, Modal, …) follows.
 */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export type BtnVariant = 'primary' | 'dark' | 'ghost' | 'green' | 'danger' | 'soft';

export type BtnSize = 'sm' | 'md' | 'lg';

export interface BtnProps {
  /** Uppercase label or plain-case string. Rendered inside the button. */
  readonly children: string;
  /** Variant token from CLAUDE.md §8.4. Defaults to `primary`. */
  readonly variant?: BtnVariant;
  /** Tap-target height: sm 36 / md 44 / lg 52 px. Defaults to `md`. */
  readonly size?: BtnSize;
  /** Fires on press/tap. No-op when `disabled` is true. */
  readonly onPress?: () => void;
  /** When true, halves opacity and skips the press transform + onPress. */
  readonly disabled?: boolean;
  /** Optional leading icon — rendered before the label. */
  readonly icon?: ReactNode;
  /** If true, button stretches to 100% of its parent's width. */
  readonly fullWidth?: boolean;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

interface VariantStyle {
  readonly background: string;
  readonly color: string;
  readonly shadow: string;
}

const VARIANTS: Record<BtnVariant, VariantStyle> = {
  primary: { background: colors.yellow, color: colors.black, shadow: shadows.card },
  dark: { background: colors.black, color: colors.white, shadow: shadows.card },
  ghost: { background: 'transparent', color: colors.black, shadow: 'none' },
  green: { background: colors.green, color: colors.black, shadow: shadows.card },
  danger: { background: colors.red, color: colors.white, shadow: shadows.card },
  soft: { background: colors.yellowSoft, color: colors.black, shadow: shadows.small },
};

const SIZES: Record<BtnSize, { height: number; paddingX: number; fontSize: number }> = {
  sm: { height: 36, paddingX: 14, fontSize: 12 },
  md: { height: 44, paddingX: 18, fontSize: 14 },
  lg: { height: 52, paddingX: 22, fontSize: 16 },
};

const BTN_RADIUS = radii[1]; // 10 — per CLAUDE.md §8.3 scale.

/** Per CLAUDE.md §8.3: on press, shift 2px and shrink the shadow to 1×1. */
const PRESSED_STYLE = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

function BtnLabel({
  text,
  color,
  fontSize,
}: {
  text: string;
  color: string;
  fontSize: number;
}): ReactElement {
  return (
    <Text
      color={color}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={fontSize}
      letterSpacing={typography.letterSpacing.widest}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

/**
 * Renders a Cachink-branded tappable button. See `btn.stories.tsx` for the
 * full variant matrix and press-state preview.
 */
export function Btn(props: BtnProps): ReactElement {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const disabled = props.disabled ?? false;
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const handlePress = disabled ? undefined : props.onPress;

  return (
    <View
      testID={props.testID ?? 'btn'}
      onPress={handlePress}
      pressStyle={disabled ? {} : PRESSED_STYLE}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={BTN_RADIUS}
      height={s.height}
      paddingHorizontal={s.paddingX}
      alignItems="center"
      justifyContent="center"
      flexDirection="row"
      gap={8}
      width={props.fullWidth === true ? '100%' : undefined}
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      style={{ boxShadow: v.shadow, userSelect: 'none' }}
    >
      {props.icon}
      <BtnLabel text={props.children} color={v.color} fontSize={s.fontSize} />
    </View>
  );
}
