/**
 * Combobox sub-components — kept in a sibling file so the main
 * `combobox.tsx` orchestrator stays under the §4.4 size budget
 * (200 lines / 40 lines per function).
 *
 * No public exports outside the Combobox folder. These components
 * exist only to compose the Tamagui Popover surface in `combobox.tsx`.
 */
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { Text, View } from '@tamagui/core';
import { Input as TamaguiInput } from '@tamagui/input';
import { Icon } from '../Icon/index';
import { colors, radii, typography } from '../../theme';
import type { ComboboxOption } from './combobox-types';

/** Trigger radius — same 12 as `<Input type="text">`. */
const TRIGGER_RADIUS = radii[2];
/** Highlighted-row background — same gray100 as Card hover. */
const ACTIVE_BACKGROUND = colors.gray100;

export interface TriggerViewProps {
  readonly testID: string;
  readonly ariaLabel?: string;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly displayText: string;
  readonly isPlaceholder: boolean;
  readonly onPress: () => void;
}

export function TriggerView(props: TriggerViewProps): ReactElement {
  const handlePress = props.disabled ? undefined : props.onPress;
  return (
    <View
      testID={props.testID}
      onPress={handlePress}
      role="combobox"
      aria-label={props.ariaLabel}
      aria-expanded={props.open}
      aria-disabled={props.disabled}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor={colors.white}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={TRIGGER_RADIUS}
      paddingHorizontal={14}
      paddingVertical={11}
      opacity={props.disabled ? 0.5 : 1}
      cursor={props.disabled ? 'default' : 'pointer'}
      style={{ userSelect: 'none' }}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={15}
        color={props.isPlaceholder ? colors.gray400 : colors.ink}
      >
        {props.displayText}
      </Text>
      <Icon name={props.open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.black} />
    </View>
  );
}

export interface SearchInputProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly autoFocus: boolean;
}

export function SearchInput(props: SearchInputProps): ReactElement {
  // Audit M-1 PR 5 (audit 5.5): the bare `autoFocus` prop on
  // TamaguiInput is unreliable across Tamagui's open-animation cycle
  // — browsers sometimes drop the focus call when the popover's
  // entry transition is still in flight. The ref-based effect below
  // re-asserts focus once the input is mounted in the DOM, which
  // covers the timing window the audit observed.
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (props.autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [props.autoFocus]);
  return (
    <View paddingHorizontal={4} paddingTop={4} paddingBottom={6} testID="combobox-search-row">
      <TamaguiInput
        ref={ref as unknown as never}
        testID="combobox-search"
        value={props.value}
        onChangeText={props.onChange}
        placeholder="Buscar..."
        aria-label="Buscar opciones"
        autoFocus={props.autoFocus}
        placeholderTextColor="$gray400"
        borderColor={colors.black}
        borderWidth={2}
        focusStyle={{ borderWidth: 2.5, borderColor: colors.black }}
        borderRadius={TRIGGER_RADIUS}
        paddingHorizontal={12}
        paddingVertical={9}
        fontSize={14}
        fontWeight={typography.weights.medium}
        color={colors.ink}
        backgroundColor={colors.white}
        fontFamily={typography.fontFamily}
        style={{ outlineWidth: 0, boxShadow: 'none', borderStyle: 'solid' }}
      />
    </View>
  );
}

export interface OptionRowProps<T extends string> {
  readonly option: ComboboxOption<T>;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export function OptionRow<T extends string>(props: OptionRowProps<T>): ReactElement {
  return (
    <View
      testID={`combobox-option-${props.option.key}`}
      onPress={props.onSelect}
      // RN's AccessibilityRole (which Tamagui's `role` prop maps to)
      // does not include `option`. Rely on aria-selected; the trigger
      // owns the `combobox` role.
      aria-selected={props.selected}
      backgroundColor={props.selected ? ACTIVE_BACKGROUND : 'transparent'}
      borderRadius={radii[1]}
      paddingHorizontal={14}
      paddingVertical={10}
      cursor="pointer"
      style={{ userSelect: 'none' }}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={props.selected ? typography.weights.bold : typography.weights.medium}
        fontSize={15}
        color={colors.ink}
      >
        {props.option.label}
      </Text>
    </View>
  );
}

export function EmptyRow(): ReactElement {
  return (
    <View paddingHorizontal={14} paddingVertical={12} testID="combobox-empty">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray400}
      >
        Sin resultados
      </Text>
    </View>
  );
}

/** Dispatched by `<TamaguiInput>`'s onChangeText (string) on every key. */
export function readSearchEvent(e: ChangeEvent<HTMLInputElement> | string): string {
  return typeof e === 'string' ? e : e.target.value;
}
