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
import { Input } from '../Input/index';
import { SegmentedToggle } from '../SegmentedToggle/index';
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

/**
 * Mode tab cluster — three equal-flex chips selecting `mensual` /
 * `anual` / `rango`.
 *
 * Audit M-1 follow-up (UI-AUDIT-1, Issue 1): the legacy hand-rolled
 * row used `<Btn size="sm">` children inside a `flex-direction: row`
 * without `flex={1}`, so each chip sized to its label and the row's
 * three chips ended up at three different widths. `SegmentedToggle`
 * already implements the `flex={1} flexBasis={0}` chip cells with the
 * proper `radiogroup`/`radio` ARIA semantics, so we delegate to it
 * here. Existing E2E selectors (`period-picker-tabs`,
 * `period-picker-tab-{mode}`) are preserved via `testID` +
 * `testIDPrefix`.
 */
function ModeTabs(props: ModeTabsProps): ReactElement {
  return (
    <SegmentedToggle<PeriodoMode>
      testID="period-picker-tabs"
      testIDPrefix="period-picker-tab"
      ariaLabel={props.labels.mensual}
      value={props.mode}
      options={[
        { key: 'mensual', label: props.labels.mensual },
        { key: 'anual', label: props.labels.anual },
        { key: 'rango', label: props.labels.rango },
      ]}
      onChange={props.onSelect}
    />
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
