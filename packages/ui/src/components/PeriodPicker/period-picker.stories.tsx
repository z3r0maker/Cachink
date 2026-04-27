/**
 * Storybook catalog for the `<PeriodPicker>` primitive.
 *
 * Stories use Spanish labels because the picker is presentation-only —
 * the i18n is owned by the consuming screen. Each story exercises a
 * distinct mode (mensual / anual / rango) so designers can review the
 * three layouts at a glance. Audit Round 2 G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { PeriodPicker, type PeriodPickerLabels, type PeriodoState } from './period-picker';

const labels: PeriodPickerLabels = {
  mensual: 'Mensual',
  anual: 'Anual',
  rango: 'Rango',
  mes: 'Mes',
  anio: 'Año',
  desde: 'Desde',
  hasta: 'Hasta',
};

function PeriodPickerDemo({ initial }: { initial: PeriodoState }): React.ReactElement {
  const [value, setValue] = useState<PeriodoState>(initial);
  return (
    <View padding={16} width={420}>
      <PeriodPicker value={value} onChange={setValue} labels={labels} />
    </View>
  );
}

const meta: Meta<typeof PeriodPicker> = {
  title: 'Phase 1C / Primitives / Period Picker',
  component: PeriodPicker,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof PeriodPicker>;

/** Mensual — year + month combo. */
export const Mensual: Story = {
  render: () => (
    <PeriodPickerDemo
      initial={{
        mode: 'mensual',
        year: '2026',
        month: '04',
        from: '',
        to: '',
      }}
    />
  ),
};

/** Anual — year only. */
export const Anual: Story = {
  render: () => (
    <PeriodPickerDemo
      initial={{
        mode: 'anual',
        year: '2026',
        month: '01',
        from: '',
        to: '',
      }}
    />
  ),
};

/** Rango — explicit from / to dates. */
export const Rango: Story = {
  render: () => (
    <PeriodPickerDemo
      initial={{
        mode: 'rango',
        year: '2026',
        month: '01',
        from: '2026-04-01',
        to: '2026-04-26',
      }}
    />
  ),
};
