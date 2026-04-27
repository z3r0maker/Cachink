/**
 * `<DateField>` — React Native variant.
 *
 * Metro auto-picks this file. Vite-based tools resolve `./date-field.tsx`
 * (the web variant) and never load this one.
 *
 * ## Why a custom Modal picker instead of @react-native-community/datetimepicker
 *
 * Adding `@react-native-community/datetimepicker` requires a `pnpm
 * install` + Metro restart + EAS Build re-bundle to register the native
 * module. To keep this PR self-contained and avoid blocking the rest of
 * the input-rewrite work behind a native-bridge dependency, this
 * variant ships a brand-styled `<Modal>` containing three touchable
 * year / month / day pickers driven by `<Combobox>` (see
 * `./date-field-picker.native.tsx`). The result is fully native-feeling
 * on RN, doesn't require a `pod install`, and can be swapped for the
 * system spinner in a follow-up without changing call sites (the
 * public prop contract is identical to the web variant).
 *
 * Closes audit blocker 1.3 on mobile.
 */
import type { ReactElement } from 'react';
import { useState } from 'react';
import { Text, View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { Icon } from '../Icon/index';
import { InputLabel, InputNote } from '../Input/input-shared';
import { Modal } from '../Modal/index';
import { colors, radii, typography } from '../../theme';
import type { DateFieldProps, IsoDateString } from './date-field.shared';
import { DatePickerPanel } from './date-field-picker.native';

export type { DateFieldProps } from './date-field.shared';

const FIELD_RADIUS = radii[2];

const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function todayIso(): IsoDateString {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function parseIso(iso: IsoDateString): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return {
    year: Number.parseInt(m[1] ?? '', 10),
    month: Number.parseInt(m[2] ?? '', 10),
    day: Number.parseInt(m[3] ?? '', 10),
  };
}

function formatDisplay(iso: IsoDateString): string {
  const parsed = parseIso(iso);
  if (parsed === null) return '';
  const monthShort = MONTHS_SHORT[parsed.month - 1] ?? '';
  return `${parsed.day} ${monthShort} ${parsed.year}`;
}

interface TriggerProps {
  readonly display: string;
  readonly placeholder: string;
  readonly testID: string;
  readonly ariaLabel: string;
  readonly onPress: () => void;
}

function Trigger(props: TriggerProps): ReactElement {
  return (
    <View
      onPress={props.onPress}
      role="button"
      aria-label={props.ariaLabel}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={FIELD_RADIUS}
      paddingHorizontal={14}
      paddingVertical={11}
      backgroundColor={colors.white}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      cursor="pointer"
      testID={`${props.testID}-trigger`}
    >
      <Text
        color={props.display === '' ? colors.gray400 : colors.ink}
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={15}
      >
        {props.display === '' ? props.placeholder : props.display}
      </Text>
      <Icon name="calendar" size={16} color={colors.gray600} />
    </View>
  );
}

interface DateModel {
  readonly seed: { year: number; month: number; day: number };
  readonly display: string;
  readonly placeholder: string;
  readonly testID: string;
  readonly ariaLabel: string;
}

function deriveDateModel(props: DateFieldProps, fallbackPlaceholder: string): DateModel {
  const seed = parseIso(props.value) ?? parseIso(todayIso());
  if (seed === null) throw new Error('DateField: failed to derive seed date.');
  return {
    seed,
    display: formatDisplay(props.value),
    placeholder: props.placeholder ?? fallbackPlaceholder,
    testID: props.testID ?? 'date-field',
    ariaLabel: props.ariaLabel ?? props.label ?? props.placeholder ?? fallbackPlaceholder,
  };
}

export function DateField(props: DateFieldProps): ReactElement {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const m = deriveDateModel(props, t('forms.date.placeholderDefault'));
  const handleCommit = (year: number, month: number, day: number): void => {
    const iso = `${pad(year)}-${pad(month)}-${pad(day)}` as IsoDateString;
    props.onChange(iso);
    setOpen(false);
  };
  return (
    <View testID={m.testID} marginBottom={14}>
      {props.label !== undefined && <InputLabel text={props.label} />}
      <Trigger
        display={m.display}
        placeholder={m.placeholder}
        testID={m.testID}
        ariaLabel={m.ariaLabel}
        onPress={() => setOpen(true)}
      />
      {props.note !== undefined && <InputNote text={props.note} />}
      <Modal open={open} onClose={() => setOpen(false)} title={props.label ?? m.placeholder}>
        <DatePickerPanel
          seedYear={m.seed.year}
          seedMonth={m.seed.month}
          seedDay={m.seed.day}
          onCommit={handleCommit}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </View>
  );
}
