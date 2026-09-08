/**
 * `<WheelQuantityPicker>` — iOS-style scroll drum for bounded
 * integers (1–999). Wraps `react-native-wheely` per ADR-050.
 *
 * Use for: cantidad de inventario, multiplicadores de receta,
 * día del mes, día de la semana. Keep IntegerField for
 * unbounded/large numbers. Keep StepperField for ±1 thresholds.
 */
import { useMemo, type ReactElement } from 'react';
import { Platform } from 'react-native';
import { Text, View } from '@tamagui/core';
import WheelPicker from 'react-native-wheely';
import { colors, fontSizes, radii, typography } from '../../theme';
import { InputError } from '../Input/input-shared';

export interface WheelQuantityPickerProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly min?: number;
  readonly max?: number;
  /** String labels to show instead of numbers (e.g. day names). */
  readonly options?: readonly string[];
  readonly error?: string;
  readonly testID?: string;
}

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 99;
const ITEM_HEIGHT = 40;
const VISIBLE_REST = 2;

function buildOptions(min: number, max: number, labels: readonly string[] | undefined): string[] {
  if (labels) return [...labels];
  const result: string[] = [];
  for (let i = min; i <= max; i++) result.push(String(i));
  return result;
}

function tryHaptic(): void {
  if (Platform.OS === 'web') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Haptics = require('expo-haptics') as {
      selectionAsync: () => Promise<void>;
    };
    void Haptics.selectionAsync();
  } catch {
    /* expo-haptics not installed — silently skip */
  }
}

function FieldLabel({ label }: { label: string }): ReactElement {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={fontSizes.xs}
      letterSpacing={typography.letterSpacing.wide}
      color={colors.gray600}
      style={{ textTransform: 'uppercase' }}
    >
      {label}
    </Text>
  );
}

const INDICATOR_STYLE = {
  borderTopWidth: 2,
  borderBottomWidth: 2,
  borderColor: colors.black,
  backgroundColor: colors.offwhite,
};

const ITEM_TEXT_STYLE = {
  fontFamily: typography.fontFamily,
  fontWeight: String(typography.weights.black) as unknown as TextStyleWeight,
  fontSize: fontSizes.xl2,
  color: colors.black,
};

function opacityFn(x: number): number {
  return 1 / (1 + Math.abs(x) * 0.6);
}
function scaleFn(x: number): number {
  return 1 - Math.min(0.3, Math.abs(x) * 0.12);
}

function WheelContainer({
  selectedIndex,
  options,
  onChange,
}: {
  selectedIndex: number;
  options: string[];
  onChange: (i: number) => void;
}): ReactElement {
  return (
    <View
      height={ITEM_HEIGHT * (VISIBLE_REST * 2 + 1)}
      borderWidth={2}
      borderColor={colors.black}
      borderRadius={radii[2]}
      backgroundColor={colors.white}
      overflow="hidden"
    >
      <WheelPicker
        selectedIndex={selectedIndex}
        options={options}
        onChange={onChange}
        itemHeight={ITEM_HEIGHT}
        visibleRest={VISIBLE_REST}
        containerStyle={{ backgroundColor: colors.white }}
        selectedIndicatorStyle={INDICATOR_STYLE}
        itemTextStyle={ITEM_TEXT_STYLE}
        opacityFunction={opacityFn}
        scaleFunction={scaleFn}
      />
    </View>
  );
}

export function WheelQuantityPicker(props: WheelQuantityPickerProps): ReactElement {
  const min = props.min ?? DEFAULT_MIN;
  const max = props.max ?? DEFAULT_MAX;

  const optionsList = useMemo(
    () => buildOptions(min, max, props.options),
    [min, max, props.options],
  );

  const selectedIndex = Math.max(0, Math.min(props.value - min, optionsList.length - 1));

  const handleChange = (index: number): void => {
    tryHaptic();
    props.onChange(min + index);
  };

  return (
    <View testID={props.testID ?? 'wheel-quantity-picker'} gap={6}>
      <FieldLabel label={props.label} />
      <WheelContainer selectedIndex={selectedIndex} options={optionsList} onChange={handleChange} />
      {props.error !== undefined && <InputError text={props.error} />}
    </View>
  );
}

/**
 * react-native-wheely types `fontWeight` as `TextStyle['fontWeight']`
 * which is `string | number`. The inline cast avoids a TS error when
 * passing the numeric weight from our tokens as a string.
 */
type TextStyleWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';
