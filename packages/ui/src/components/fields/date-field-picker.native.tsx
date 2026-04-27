/**
 * `<DatePickerPanel>` — modal body of the RN date picker.
 *
 * Extracted from `date-field.native.tsx` so each file stays under the
 * CLAUDE.md §4.4 200-line ceiling. Owns the year / month / day combobox
 * triplet and the Cancel / Guardar action row. Receives a fully-derived
 * date triple as input and emits the committed ISO date back to its
 * caller.
 */
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { View } from '@tamagui/core';
import { useTranslation } from '../../i18n/index';
import { Btn } from '../Btn/index';
import { Combobox, type ComboboxOption } from '../Combobox/index';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface PickerOptions {
  readonly years: readonly ComboboxOption[];
  readonly months: readonly ComboboxOption[];
  readonly days: readonly ComboboxOption[];
}

/**
 * Build the three combobox option lists for a given (year, month).
 * Year list spans 5 past + 1 future year. Month list is the 12 es-MX
 * names with `MM ` prefix. Day list is sized to the (year, month)
 * combination so `daysInMonth` is correct across leap-years and
 * 30/31-day months.
 */
function usePickerOptions(year: number, month: number): PickerOptions {
  const years = useMemo<readonly ComboboxOption[]>(() => {
    const current = new Date().getUTCFullYear();
    const list: ComboboxOption[] = [];
    for (let y = current + 1; y >= current - 5; y -= 1) {
      list.push({ key: String(y), label: String(y) });
    }
    return list;
  }, []);
  const months = useMemo<readonly ComboboxOption[]>(
    () =>
      MONTHS_ES.map((name, idx) => ({
        key: pad(idx + 1),
        label: `${pad(idx + 1)} ${name}`,
      })),
    [],
  );
  const days = useMemo<readonly ComboboxOption[]>(() => {
    const max = daysInMonth(year, month);
    const list: ComboboxOption[] = [];
    for (let d = 1; d <= max; d += 1) list.push({ key: pad(d), label: pad(d) });
    return list;
  }, [year, month]);
  return { years, months, days };
}

interface TripletProps {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly options: PickerOptions;
  readonly onYear: (year: number) => void;
  readonly onMonth: (month: number) => void;
  readonly onDay: (day: number) => void;
}

function Triplet(props: TripletProps): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Combobox
          value={String(props.year)}
          options={props.options.years}
          onChange={(v) => props.onYear(Number.parseInt(v, 10))}
          ariaLabel="Año"
        />
      </View>
      <View flex={2}>
        <Combobox
          value={pad(props.month)}
          options={props.options.months}
          onChange={(v) => props.onMonth(Number.parseInt(v, 10))}
          ariaLabel="Mes"
        />
      </View>
      <View flex={1}>
        <Combobox
          value={pad(props.day)}
          options={props.options.days}
          onChange={(v) => props.onDay(Number.parseInt(v, 10))}
          ariaLabel="Día"
        />
      </View>
    </View>
  );
}

interface ActionsProps {
  readonly onCancel: () => void;
  readonly onCommit: () => void;
}

function PickerActions(props: ActionsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" gap={10} marginTop={6}>
      <View flex={1}>
        <Btn variant="ghost" onPress={props.onCancel}>
          {t('actions.cancel')}
        </Btn>
      </View>
      <View flex={1}>
        <Btn variant="primary" onPress={props.onCommit}>
          {t('actions.save')}
        </Btn>
      </View>
    </View>
  );
}

export interface DatePickerPanelProps {
  readonly seedYear: number;
  readonly seedMonth: number;
  readonly seedDay: number;
  readonly onCommit: (year: number, month: number, day: number) => void;
  readonly onCancel: () => void;
}

export function DatePickerPanel(props: DatePickerPanelProps): ReactElement {
  const [year, setYear] = useState(props.seedYear);
  const [month, setMonth] = useState(props.seedMonth);
  const [day, setDay] = useState(props.seedDay);
  const options = usePickerOptions(year, month);
  return (
    <View flexDirection="column" gap={12}>
      <Triplet
        year={year}
        month={month}
        day={day}
        options={options}
        onYear={setYear}
        onMonth={setMonth}
        onDay={setDay}
      />
      <PickerActions onCancel={props.onCancel} onCommit={() => props.onCommit(year, month, day)} />
    </View>
  );
}
