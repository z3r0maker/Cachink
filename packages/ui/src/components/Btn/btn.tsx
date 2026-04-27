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
 *
 * ## Audit M-1 STEP0-T01 — `<Pressable>` over Tamagui `<View onPress>`
 *
 * The Btn root used to be a Tamagui `<View>` with `onPress`. Tamagui
 * routes `onPress` through a JS-layer pointer-event wrapper, which on
 * iOS does **not** fire when Maestro / XCUI dispatches a synthetic
 * tap against the underlying iOS view (no native gesture recognizer
 * is registered). E2E flows that taps any Btn (consent modal,
 * wizard CTAs, GUARDAR, COMPARTIR, etc.) silently no-op'd despite
 * Maestro reporting "Tap … COMPLETED".
 *
 * The fix is to root the primitive on React Native's `<Pressable>`,
 * which is a real RN component with native gesture recognition on
 * iOS / Android **and** is polyfilled by `react-native-web` to a
 * `<div role="button">` with `:active` state — so the same component
 * handles taps on every platform target. The `pressed` callback
 * lets us still apply the §8.3 press transform (translate 2/2 +
 * shrunk shadow). All Tamagui style props are translated to RN
 * `style` props on the Pressable root; the visual output in jsdom
 * (vitest) and on the iPad sim is identical to the previous
 * Tamagui-rooted version.
 */
import type { ReactElement, ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { Text } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export type BtnVariant = 'primary' | 'dark' | 'ghost' | 'green' | 'danger' | 'soft' | 'outline';

export type BtnSize = 'sm' | 'md' | 'lg';

export interface BtnProps {
  /**
   * Uppercase label or plain-case string. Rendered inside the button.
   * Optional when `icon` is present — icon-only buttons set the
   * accessible name via `ariaLabel` instead.
   */
  readonly children?: string;
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
  /**
   * Explicit screen-reader label. Falls back to the `children` string.
   * Pass when the button label is an icon or abbreviation.
   *
   * Named `ariaLabel` per ADR-034 — the value is forwarded to Tamagui's
   * `aria-label`, matching Tamagui 2.x's removal of RN-style a11y prop
   * translation. On React Native we'll layer `accessibilityLabel` back
   * in via a platform-variant when Phase 1B wires the mobile shell.
   */
  readonly ariaLabel?: string;
  /**
   * Override the default `role="button"` — pass `'radio'` (or other
   * ARIA role) when the Btn is acting as a member of a `<radiogroup>`
   * or similar composite. Audit Round 2 G1.
   */
  readonly role?: 'button' | 'radio' | 'tab' | 'menuitem';
  /**
   * When `role="radio"`, mirror the selected state so screen readers
   * read out the active chip. Ignored when `role !== 'radio'`.
   * Audit Round 2 G1.
   */
  readonly ariaChecked?: boolean;
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
  // `outline` is the white-with-hard-border companion to `primary` —
  // used as the CANCELAR slot next to a primary GUARDAR (mock 3,
  // April 2026 design review). Keeps the §8.3 hard shadow so the
  // press transform still feels tactile.
  outline: { background: colors.white, color: colors.black, shadow: shadows.card },
};

const SIZES: Record<BtnSize, { height: number; paddingX: number; fontSize: number }> = {
  // `sm` bumped 36 → 40 + hitSlop on root pushes the effective tap-target
  // over the 44×44 iOS HIG / Android Material target floor (P1C-M12-T04).
  sm: { height: 40, paddingX: 14, fontSize: 12 },
  md: { height: 44, paddingX: 18, fontSize: 14 },
  lg: { height: 52, paddingX: 22, fontSize: 16 },
};

const BTN_RADIUS = radii[1]; // 10 — per CLAUDE.md §8.3 scale.

/**
 * Per CLAUDE.md §8.3: on press, shift 2px and shrink the shadow to 1×1.
 * Used as the second element of `Pressable.style`'s array form when
 * `pressed === true`, layered on top of the base style.
 */
const PRESSED_STYLE: ViewStyle = {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  // `boxShadow` is the modern RN 0.76+ ViewStyle key; on web it maps
  // to inline CSS `box-shadow` via react-native-web, on native it
  // renders the §8.3 hard drop shadow via the new Fabric path.
  boxShadow: shadows.pressed,
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
      // Audit 9.3 — Spanish strings are typically 30 % longer than
      // English. Without `numberOfLines={1}` long labels like
      // "REGISTRAR PAGO" or "COMPARTIR COMPROBANTE" wrap the button on
      // phone widths and break the §8.3 hit-target geometry.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — older users who scale system text up to 130 % still
      // need the button label to fit. Without a cap, RN's
      // `allowFontScaling` (default true) makes labels overflow at
      // higher scales. Cap at 1.3× — in line with iOS HIG's "support
      // larger sizes but don't break layouts" guidance.
      maxFontSizeMultiplier={1.3}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

interface ResolvedBtn {
  readonly v: VariantStyle;
  readonly s: { height: number; paddingX: number; fontSize: number };
  readonly disabled: boolean;
  readonly handlePress: (() => void) | undefined;
}

function resolve(props: BtnProps): ResolvedBtn {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const disabled = props.disabled ?? false;
  return {
    v: VARIANTS[variant],
    s: SIZES[size],
    disabled,
    handlePress: disabled ? undefined : props.onPress,
  };
}

/**
 * Builds the static style for the Pressable root. Extracted from `Btn`
 * to keep the component body under the §4.4 40-line cap.
 *
 * The cast at the return site covers two web-only keys:
 * `cursor: 'not-allowed'` and `userSelect: 'none'`. RN's ViewStyle
 * types only accept a subset of `cursor` values (no `'not-allowed'`),
 * but react-native-web forwards both to inline CSS. Native platforms
 * ignore them — there is no runtime branch.
 */
function buildBaseStyle(
  v: VariantStyle,
  s: { height: number; paddingX: number; fontSize: number },
  disabled: boolean,
  fullWidth: boolean,
): ViewStyle {
  return {
    backgroundColor: v.background,
    borderColor: colors.black,
    borderWidth: 2,
    borderRadius: BTN_RADIUS,
    height: s.height,
    paddingHorizontal: s.paddingX,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    boxShadow: v.shadow,
  } as ViewStyle;
}

/**
 * Renders a Cachink-branded tappable button. See `btn.stories.tsx` for the
 * full variant matrix and press-state preview.
 */
export function Btn(props: BtnProps): ReactElement {
  const { v, s, disabled, handlePress } = resolve(props);
  const baseStyle = buildBaseStyle(v, s, disabled, props.fullWidth === true);
  // We forward the modern ARIA props (`aria-disabled`,
  // `aria-checked`, `role`) directly. react-native-web's Pressable
  // would otherwise omit `aria-disabled="false"` / `aria-checked="false"`
  // from the DOM when the underlying value is false (it only emits
  // the attribute on a truthy state). The Tamagui `<View>` we used
  // before always emitted both states; the explicit forwarding below
  // restores that contract so a11y assertions stay green and screen
  // readers receive the full radio-group / disabled state vector.
  return (
    <Pressable
      testID={props.testID ?? 'btn'}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      role={props.role ?? 'button'}
      aria-label={props.ariaLabel ?? props.children ?? ''}
      aria-disabled={disabled}
      aria-checked={props.role === 'radio' ? props.ariaChecked === true : undefined}
      style={({ pressed }) => [baseStyle, pressed && !disabled ? PRESSED_STYLE : null]}
    >
      {props.icon}
      {props.children !== undefined && (
        <BtnLabel text={props.children} color={v.color} fontSize={s.fontSize} />
      )}
    </Pressable>
  );
}
