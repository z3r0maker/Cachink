/**
 * StepperField — [−] [value] [+] with tap-to-edit (Audit M-1 PR 5).
 *
 * Renders a horizontal row with decrement/increment buttons flanking a
 * central numeric display. Tapping the value opens a small TextInput for
 * direct editing. Long-press on −/+ auto-repeats.
 *
 * Use case: stock alert threshold (umbralStockBajo) in NuevoProductoModal.
 */
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Pressable, TextInput, type ViewStyle } from 'react-native';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';
import { InputError } from '../Input/input-shared';

export interface StepperFieldProps {
  readonly label: string;
  readonly value: number;
  readonly onChange: (next: number) => void;
  readonly min?: number;
  readonly max?: number;
  /** Validation error — red text rendered below the stepper. */
  readonly error?: string;
  readonly testID?: string;
}

const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 120;

const btnStyle: ViewStyle = {
  width: 44,
  height: 44,
  borderRadius: radii[2],
  borderWidth: 2,
  borderColor: colors.black,
  backgroundColor: colors.white,
  alignItems: 'center',
  justifyContent: 'center',
};

const btnPressedStyle: ViewStyle = {
  ...btnStyle,
  backgroundColor: colors.gray100,
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function useLongPressRepeat(onStep: () => void) {
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clear = useCallback(() => {
    if (interval.current) clearInterval(interval.current);
    if (timeout.current) clearTimeout(timeout.current);
    interval.current = null;
    timeout.current = null;
  }, []);
  useEffect(() => clear, [clear]);
  const onLongPress = useCallback(() => {
    timeout.current = setTimeout(() => {
      interval.current = setInterval(onStep, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }, [onStep]);
  return { onLongPress, onPressOut: clear };
}

function StepButton({
  label,
  onStep,
  testID,
}: {
  label: string;
  onStep: () => void;
  testID: string;
}): ReactElement {
  const { onLongPress, onPressOut } = useLongPressRepeat(onStep);
  return (
    <Pressable
      testID={testID}
      onPress={onStep}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      style={({ pressed }) => (pressed ? btnPressedStyle : btnStyle)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={colors.black}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const INPUT_STYLE = {
  width: 56,
  height: 44,
  textAlign: 'center' as const,
  fontFamily: typography.fontFamily,
  fontWeight: 'bold' as const,
  fontSize: 18,
  color: colors.black,
  borderWidth: 2,
  borderColor: colors.black,
  borderRadius: radii[2],
  backgroundColor: colors.white,
};

interface StepperCenterProps {
  readonly editing: boolean;
  readonly editText: string;
  readonly setEditText: (v: string) => void;
  readonly commitEdit: () => void;
  readonly startEdit: () => void;
  readonly value: number;
  readonly testID: string;
}

function StepperCenter(props: StepperCenterProps): ReactElement {
  if (props.editing) {
    return (
      <TextInput
        testID={`${props.testID}-input`}
        value={props.editText}
        onChangeText={(t) => props.setEditText(t.replace(/\D/g, ''))}
        onBlur={props.commitEdit}
        onSubmitEditing={props.commitEdit}
        keyboardType="number-pad"
        autoFocus
        style={INPUT_STYLE}
      />
    );
  }
  return (
    <Pressable onPress={props.startEdit} testID={`${props.testID}-value`}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.black}
        textAlign="center"
        minWidth={56}
      >
        {props.value}
      </Text>
    </Pressable>
  );
}

function useStepperCallbacks(props: StepperFieldProps, min: number, max: number) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const step = useCallback(
    (delta: number) => props.onChange(clamp(props.value + delta, min, max)),
    [props.value, props.onChange, min, max],
  );
  const commitEdit = useCallback(() => {
    const n = Number.parseInt(editText, 10);
    if (Number.isFinite(n)) props.onChange(clamp(n, min, max));
    setEditing(false);
  }, [editText, props.onChange, min, max]);
  const startEdit = useCallback(() => {
    setEditText(String(props.value));
    setEditing(true);
  }, [props.value]);
  return { editing, editText, setEditText, step, commitEdit, startEdit };
}

export function StepperField(props: StepperFieldProps): ReactElement {
  const min = props.min ?? DEFAULT_MIN;
  const max = props.max ?? DEFAULT_MAX;
  const testID = props.testID ?? 'stepper';
  const cb = useStepperCallbacks(props, min, max);
  return (
    <View testID={props.testID ?? 'stepper-field'} gap={6}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {props.label}
      </Text>
      <View flexDirection="row" alignItems="center" gap={12}>
        <StepButton label="−" onStep={() => cb.step(-1)} testID={`${testID}-dec`} />
        <StepperCenter
          editing={cb.editing}
          editText={cb.editText}
          setEditText={cb.setEditText}
          commitEdit={cb.commitEdit}
          startEdit={cb.startEdit}
          value={props.value}
          testID={testID}
        />
        <StepButton label="+" onStep={() => cb.step(1)} testID={`${testID}-inc`} />
      </View>
      {props.error !== undefined && <InputError text={props.error} />}
    </View>
  );
}
