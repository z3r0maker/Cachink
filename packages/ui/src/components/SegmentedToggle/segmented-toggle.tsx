/**
 * SegmentedToggle — chip-toggle radio group (ADR-040).
 *
 * Horizontal row of equally-sized "chip" buttons that behave as a radio
 * group. The active option is brand yellow with the §8.3 hard 2-px
 * black border + hard drop shadow; the others are transparent ghost
 * cells that share the row's outer border. Replaces `<Input
 * type="select">` in places the design mocks render a tactile pill row
 * — most notably the `MÉTODO DE PAGO` field in NuevaVenta (mock 3) and
 * the `Gasto / Nómina / Inventario` sub-tab selector in NuevoEgreso.
 *
 * Generic over the option key type so consumers can pass concrete
 * domain unions (`PaymentMethod`, `EgresoTab`, etc.) without losing
 * literal-type information.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, shadows, typography } from '../../theme';

export interface SegmentedToggleOption<T extends string> {
  /** Stable key compared against `value`. */
  readonly key: T;
  /**
   * Visible label. Casing is preserved; the row uses
   * `letterSpacing.wide` but no uppercase transform — proper-cased
   * Spanish labels (`Efectivo`, `Transferencia`) match the mocks.
   */
  readonly label: string;
}

export interface SegmentedToggleProps<T extends string> {
  /** Optional uppercase eyebrow rendered above the row. */
  readonly label?: string;
  /** Currently selected option key. */
  readonly value: T;
  /** Equal-flex chip cells. Must contain at least 2 entries. */
  readonly options: readonly SegmentedToggleOption<T>[];
  /** Fires when a non-active chip is tapped. */
  readonly onChange: (next: T) => void;
  /**
   * When true, halves opacity and skips onChange. Useful for fields
   * locked while a parent form is submitting.
   */
  readonly disabled?: boolean;
  /** Forwarded to the root row so E2E tests can anchor to it. */
  readonly testID?: string;
  /**
   * Per-chip testID prefix. Each chip gets `${testIDPrefix}-${key}`.
   * Defaults to `'segmented-toggle'`. Override when migrating an
   * existing tab bar so the new SegmentedToggle preserves the
   * existing E2E selectors (e.g. `'inventario-tab'` produces
   * `inventario-tab-stock` / `inventario-tab-movimientos`).
   */
  readonly testIDPrefix?: string;
  /**
   * Screen-reader description for the whole group. Matches the
   * `radiogroup` ARIA pattern.
   */
  readonly ariaLabel?: string;
}

/** Pill radius — 20 from the §8.3 scale, matches Tag and the mock. */
const CHIP_RADIUS = radii[6];

const PRESSED_STYLE = {
  transform: [{ translateX: 2 }, { translateY: 2 }] as const,
  style: { boxShadow: shadows.pressed },
};

interface SegmentChipProps {
  readonly label: string;
  readonly active: boolean;
  readonly disabled: boolean;
  readonly onPress: () => void;
  readonly testID: string;
}

function SegmentChip(props: SegmentChipProps): ReactElement {
  const background = props.active ? colors.yellow : 'transparent';
  const color = props.active ? colors.black : colors.gray600;
  const shadow = props.active ? shadows.small : 'none';
  const handlePress = props.disabled || props.active ? undefined : props.onPress;

  return (
    <View
      testID={props.testID}
      onPress={handlePress}
      pressStyle={handlePress ? PRESSED_STYLE : {}}
      flex={1}
      flexBasis={0}
      // Audit M-1 PR 5 (audit 3.2): chip height stays at 40 (matches
      // the visual rhythm of the §8 brand toggle row), but `hitSlop`
      // pushes the effective tap target to 48 pt — above the 44-pt
      // iOS HIG / Android Material minimum without a visual change.
      height={40}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      backgroundColor={background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={CHIP_RADIUS}
      alignItems="center"
      justifyContent="center"
      cursor={handlePress ? 'pointer' : 'default'}
      opacity={props.disabled && !props.active ? 0.5 : 1}
      role="radio"
      aria-checked={props.active}
      aria-disabled={props.disabled}
      style={{ boxShadow: shadow, userSelect: 'none' }}
    >
      <Text
        color={color}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        letterSpacing={typography.letterSpacing.wide}
      >
        {props.label}
      </Text>
    </View>
  );
}

interface EyebrowProps {
  readonly text: string;
}

function Eyebrow(props: EyebrowProps): ReactElement {
  return (
    <Text
      testID="segmented-toggle-label"
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={12}
      letterSpacing={typography.letterSpacing.wide}
      marginBottom={6}
      style={{ textTransform: 'uppercase' }}
    >
      {props.text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink chip-toggle row. See
 * `segmented-toggle.stories.tsx` for the full variant catalog.
 */
export function SegmentedToggle<T extends string>(props: SegmentedToggleProps<T>): ReactElement {
  const disabled = props.disabled ?? false;
  const chipPrefix = props.testIDPrefix ?? 'segmented-toggle';
  return (
    <View testID={props.testID ?? 'segmented-toggle'}>
      {props.label !== undefined && <Eyebrow text={props.label} />}
      <View
        flexDirection="row"
        gap={8}
        role="radiogroup"
        aria-label={props.ariaLabel ?? props.label}
      >
        {props.options.map((option) => (
          <SegmentChip
            key={option.key}
            label={option.label}
            active={option.key === props.value}
            disabled={disabled}
            onPress={() => props.onChange(option.key)}
            testID={`${chipPrefix}-${option.key}`}
          />
        ))}
      </View>
    </View>
  );
}
