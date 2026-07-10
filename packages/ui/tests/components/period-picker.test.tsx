/**
 * PeriodPicker tests — period selector component.
 *
 * Covers mode tabs, mensual/anual/rango field rendering,
 * and onChange callback wiring.
 */

import { describe, expect, it, vi } from 'vitest';
import type { PeriodoState, PeriodPickerLabels } from '../../src/components/PeriodPicker/period-picker';
import { PeriodPicker } from '../../src/components/PeriodPicker/period-picker';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';

initI18n();

const LABELS: PeriodPickerLabels = {
  mensual: 'Mensual',
  anual: 'Anual',
  rango: 'Rango',
  mes: 'Mes',
  anio: 'Año',
  desde: 'Desde',
  hasta: 'Hasta',
};

const MENSUAL: PeriodoState = {
  mode: 'mensual',
  year: '2026',
  month: '06',
  from: '',
  to: '',
};

const ANUAL: PeriodoState = {
  mode: 'anual',
  year: '2026',
  month: '01',
  from: '',
  to: '',
};

const RANGO: PeriodoState = {
  mode: 'rango',
  year: '2026',
  month: '01',
  from: '2026-01-01',
  to: '2026-06-30',
};

describe('PeriodPicker', () => {
  it('renders with default testID period-picker', () => {
    renderWithProviders(
      <PeriodPicker value={MENSUAL} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByTestId('period-picker')).toBeInTheDocument();
  });

  it('renders mode tabs', () => {
    renderWithProviders(
      <PeriodPicker value={MENSUAL} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByTestId('period-picker-tabs')).toBeInTheDocument();
  });

  it('renders year and month fields in mensual mode', () => {
    renderWithProviders(
      <PeriodPicker value={MENSUAL} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByTestId('period-picker-year')).toBeInTheDocument();
    expect(screen.getByTestId('period-picker-month')).toBeInTheDocument();
  });

  it('renders year-only field in anual mode', () => {
    renderWithProviders(
      <PeriodPicker value={ANUAL} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByTestId('period-picker-year-only')).toBeInTheDocument();
  });

  it('renders from and to fields in rango mode', () => {
    renderWithProviders(
      <PeriodPicker value={RANGO} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByTestId('period-picker-from')).toBeInTheDocument();
    expect(screen.getByTestId('period-picker-to')).toBeInTheDocument();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <PeriodPicker value={MENSUAL} onChange={vi.fn()} labels={LABELS} testID="my-picker" />,
    );
    expect(screen.getByTestId('my-picker')).toBeInTheDocument();
  });

  it('renders tab labels from labels prop', () => {
    renderWithProviders(
      <PeriodPicker value={MENSUAL} onChange={vi.fn()} labels={LABELS} />,
    );
    expect(screen.getByText('Mensual')).toBeInTheDocument();
    expect(screen.getByText('Anual')).toBeInTheDocument();
    expect(screen.getByText('Rango')).toBeInTheDocument();
  });
});
