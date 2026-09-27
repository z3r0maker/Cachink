/**
 * Btn — the Xangarro primary button primitive.
 *
 * El Mostrador's four buttons (docs/design/el-mostrador.md §3: primary,
 * secondary, quiet, destructive, plus the filled destructive confirm) beside
 * the older variants the pre-Track-M screens still use; the tables live in
 * `./btn-variants.ts`. The hard edge, the hard shadow and the press stamp
 * (translate 2/2, shadow to `pressed`) are shared by all of them.
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
import { radii, shadows, typography } from '../../theme';
import { impactLight } from '../../haptics/index';
import { Spinner } from '../Spinner/index';
import {
  DISABLED_MOSTRADOR,
  SIZES,
  VARIANTS,
  type BtnSize,
  type BtnVariant,
  type SizeStyle,
  type VariantStyle,
} from './btn-variants';

export type { BtnSize, BtnVariant } from './btn-variants';

interface BtnBaseProps {
  /** Variant token from CLAUDE.md §8.4. Defaults to `primary`. */
  readonly variant?: BtnVariant;
  /** Tap-target height: sm 40 / md 44 / lg 52 / xl 56 px. Defaults to `md`. */
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
  /** When true, replaces the label with a Spinner and disables interaction. */
  readonly loading?: boolean;
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
  /**
   * Sentence-case, extra-bold label (El Mostrador §3). On by default for the
   * El Mostrador variants and for `size="xl"`; pass it to a `primary` that
   * sits among them.
   */
  readonly sentence?: boolean;
}

/**
 * A button with a visible text label. The label *is* the accessible name, so
 * `ariaLabel` is optional here and only needed to override it (an abbreviation
 * a screen reader should expand, say).
 */
interface BtnWithLabelProps extends BtnBaseProps {
  /** Uppercase label or plain-case string. Rendered inside the button. */
  readonly children: string;
  /**
   * Overrides the accessible name that `children` would otherwise provide.
   *
   * Named `ariaLabel` per ADR-034 — forwarded to the RN `Pressable` as
   * `aria-label`, which React Native maps to `accessibilityLabel` on iOS and
   * Android (RN ≥ 0.71) and react-native-web renders directly.
   */
  readonly ariaLabel?: string;
}

/**
 * An icon-only button. It renders no text, so `ariaLabel` is **required** —
 * without it VoiceOver and TalkBack announce nothing but "button".
 *
 * This used to be optional, and `empleado-list-item.tsx` shipped a delete
 * button whose accessible name resolved to the empty string. Requiring it
 * here makes that unrepresentable rather than merely discouraged, matching
 * the contract `FAB` has always had. Audit 2026-09.
 */
interface BtnIconOnlyProps extends BtnBaseProps {
  readonly children?: undefined;
  readonly icon: ReactNode;
  readonly ariaLabel: string;
}

export type BtnProps = BtnWithLabelProps | BtnIconOnlyProps;

const BTN_RADIUS = radii[1]; // 10 — per CLAUDE.md §8.3 scale.
/** El Mostrador buttons round at 14 (`mostrador.css.ts` `boton`). */
const MOSTRADOR_RADIUS = radii[3];

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
  sentence,
}: {
  text: string;
  color: string;
  fontSize: number;
  sentence: boolean;
}): ReactElement {
  return (
    <Text
      color={color}
      fontFamily={typography.fontFamily}
      fontWeight={sentence ? typography.weights.extraBold : typography.weights.bold}
      fontSize={fontSize}
      letterSpacing={sentence ? typography.letterSpacing.normal : typography.letterSpacing.widest}
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
      style={sentence ? undefined : { textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

interface ResolvedBtn {
  readonly v: VariantStyle;
  readonly s: SizeStyle;
  readonly sentence: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly handlePress: (() => void) | undefined;
}

function resolve(props: BtnProps): ResolvedBtn {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const loading = props.loading ?? false;
  const disabled = (props.disabled ?? false) || loading;
  const base = VARIANTS[variant];
  const sentence = props.sentence ?? (base.mostrador || size === 'xl');
  // A disabled El Mostrador confirm turns gray rather than fading (§3).
  const v = disabled && !loading && sentence ? DISABLED_MOSTRADOR : base;
  return {
    v,
    s: SIZES[size],
    sentence,
    disabled,
    loading,
    handlePress: disabled
      ? undefined
      : () => {
          impactLight();
          props.onPress?.();
        },
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
function buildBaseStyle(r: ResolvedBtn, fullWidth: boolean): ViewStyle {
  const { v, s, disabled } = r;
  const grayed = v === DISABLED_MOSTRADOR;
  return {
    backgroundColor: v.background,
    borderColor: v.borderColor,
    borderWidth: v.borderWidth,
    borderRadius: r.sentence ? MOSTRADOR_RADIUS : BTN_RADIUS,
    height: s.height,
    paddingHorizontal: s.paddingX,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    width: fullWidth ? '100%' : undefined,
    opacity: disabled && !grayed ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    boxShadow: v.shadow,
  } as ViewStyle;
}

/**
 * Renders a Xangarro-branded tappable button. See `btn.stories.tsx` for the
 * full variant matrix and press-state preview.
 */
export function Btn(props: BtnProps): ReactElement {
  const r = resolve(props);
  const { v, s, disabled, loading, handlePress } = r;
  const baseStyle = buildBaseStyle(r, props.fullWidth === true);
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
      // No `?? ''` fallback: the union above guarantees one of these two is a
      // non-empty string, and an empty accessible name is worse than none —
      // it silently suppresses the label a screen reader would otherwise
      // derive from the children.
      aria-label={props.ariaLabel ?? props.children}
      aria-disabled={disabled}
      aria-checked={props.role === 'radio' ? props.ariaChecked === true : undefined}
      style={({ pressed }) => [baseStyle, pressed && !disabled ? PRESSED_STYLE : null]}
    >
      {loading ? (
        <Spinner size={props.fullWidth ? 'md' : 'sm'} />
      ) : (
        <>
          {props.icon}
          {props.children !== undefined && (
            <BtnLabel
              text={props.children}
              color={v.color}
              fontSize={r.sentence ? s.mostradorFontSize : s.fontSize}
              sentence={r.sentence}
            />
          )}
        </>
      )}
    </Pressable>
  );
}
