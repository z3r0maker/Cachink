/**
 * PeriodPicker — the Estados Financieros period selector (P1C-M8-T01,
 * Slice 3 C9).
 *
 * Three modes: `mensual` (year + month), `anual` (year), `rango` (from/to).
 * Controlled component: parent owns the state and reads the derived
 * `{ from, to }` via `usePeriodoRange`.
 *
 * Pure Tamagui + HTML select/date inputs — no native-only APIs — so one
 * implementation works on both mobile and desktop. Visual is neobrutalist:
 * a tab bar for mode, then the matching inputs.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { Input } from '../Input/index';
import { DateField } from '../fields/index';

export type PeriodoMode = 'mensual' | 'anual' | 'rango';

export interface PeriodoState {
  readonly mode: PeriodoMode;
  /** YYYY, used in `anual` and `mensual`. */
  readonly year: string;
  /** 1-12 (as string), used in `mensual`. */
  readonly month: string;
  /** ISO date, used in `rango`. */
  readonly from: string;
  /** ISO date, used in `rango`. */
  readonly to: string;
}

export interface PeriodPickerProps {
  readonly value: PeriodoState;
  readonly onChange: (next: PeriodoState) => void;
  readonly labels: PeriodPickerLabels;
  readonly testID?: string;
}

export interface PeriodPickerLabels {
  readonly mensual: string;
  readonly anual: string;
  readonly rango: string;
  readonly mes: string;
  readonly anio: string;
  readonly desde: string;
  readonly hasta: string;
}

const MONTHS: readonly string[] = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
];

interface ModeTabsProps {
  readonly mode: PeriodoMode;
  readonly labels: PeriodPickerLabels;
  readonly onSelect: (mode: PeriodoMode) => void;
}

function ModeTabs(props: ModeTabsProps): ReactElement {
  const pairs: readonly [PeriodoMode, string][] = [
    ['mensual', props.labels.mensual],
    ['anual', props.labels.anual],
    ['rango', props.labels.rango],
  ];
  // Audit Round 2 G1: the mode-tab cluster is a single-select radio
  // group — surface `role="radiogroup"` on the container and
  // `role="radio"` + `aria-checked` per chip so screen readers
  // announce them as a coherent selector instead of three disjoint
  // buttons.
  return (
    <View flexDirection="row" gap={8} testID="period-picker-tabs" role="radiogroup">
      {pairs.map(([mode, label]) => (
        <Btn
          key={mode}
          variant={props.mode === mode ? 'dark' : 'ghost'}
          size="sm"
          onPress={() => props.onSelect(mode)}
          testID={`period-picker-tab-${mode}`}
          role="radio"
          ariaChecked={props.mode === mode}
        >
          {label}
        </Btn>
      ))}
    </View>
  );
}

function MensualFields(props: PeriodPickerProps): ReactElement {
  const { value: v, onChange, labels } = props;
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <Input
          type="number"
          label={labels.anio}
          value={v.year}
          onChange={(year) => onChange({ ...v, year })}
          testID="period-picker-year"
        />
      </View>
      <View flex={1}>
        <Input
          type="select"
          label={labels.mes}
          value={v.month}
          onChange={(month) => onChange({ ...v, month })}
          options={MONTHS}
          testID="period-picker-month"
        />
      </View>
    </View>
  );
}

function AnualFields(props: PeriodPickerProps): ReactElement {
  const { value: v, onChange, labels } = props;
  return (
    <Input
      type="number"
      label={labels.anio}
      value={v.year}
      onChange={(year) => onChange({ ...v, year })}
      testID="period-picker-year-only"
    />
  );
}

function RangoFields(props: PeriodPickerProps): ReactElement {
  const { value: v, onChange, labels } = props;
  return (
    <View flexDirection="row" gap={10}>
      <View flex={1}>
        <DateField
          label={labels.desde}
          value={v.from}
          onChange={(from) => onChange({ ...v, from })}
          testID="period-picker-from"
        />
      </View>
      <View flex={1}>
        <DateField
          label={labels.hasta}
          value={v.to}
          onChange={(to) => onChange({ ...v, to })}
          testID="period-picker-to"
        />
      </View>
    </View>
  );
}

function ModeFields(props: PeriodPickerProps): ReactElement {
  switch (props.value.mode) {
    case 'mensual':
      return <MensualFields {...props} />;
    case 'anual':
      return <AnualFields {...props} />;
    case 'rango':
      return <RangoFields {...props} />;
  }
}

export function PeriodPicker(props: PeriodPickerProps): ReactElement {
  const { value, onChange, labels } = props;
  const handleSelect = (mode: PeriodoMode): void => onChange({ ...value, mode });
  return (
    <View testID={props.testID ?? 'period-picker'} gap={12}>
      <ModeTabs mode={value.mode} labels={labels} onSelect={handleSelect} />
      <ModeFields {...props} />
    </View>
  );
}
