/**
 * A11y pass #2 — semantic ARIA roles on layout primitives
 * (Audit Round 2, slice G1).
 *
 * Complements `a11y.test.tsx` (which asserts focusable-control labels)
 * by verifying the *semantic* roles screen readers use to build the
 * page outline: `role="status"`, `role="alert"`, `role="heading"`,
 * `role="meter"`, `role="radiogroup"`, `role="list"`, plus the Kpi
 * combined `aria-label`.
 *
 * One assertion per primitive — we use `getByRole(...)` (the
 * recommended Testing-Library query) where possible, falling back to
 * `getByTestId` + attribute lookup when the role is on a nested node.
 */

import { describe, expect, it } from 'vitest';
import { ErrorState } from '../src/components/ErrorState/index';
import { Gauge } from '../src/components/Gauge/index';
import { Kpi } from '../src/components/Kpi/index';
import { List } from '../src/components/List/index';
import {
  PeriodPicker,
  type PeriodPickerLabels,
  type PeriodoState,
} from '../src/components/PeriodPicker/index';
import { SectionTitle } from '../src/components/SectionTitle/index';
import { Skeleton } from '../src/components/Skeleton/index';
import { initI18n } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

initI18n();

const periodLabels: PeriodPickerLabels = {
  mensual: 'Mensual',
  anual: 'Anual',
  rango: 'Rango',
  mes: 'Mes',
  anio: 'Año',
  desde: 'Desde',
  hasta: 'Hasta',
};

describe('A11y semantics — primitives', () => {
  it('Skeleton.Row announces as role="status" with aria-busy + i18n aria-label', () => {
    renderWithProviders(<Skeleton.Row index={0} testIDPrefix="ventas-skeleton" />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status.getAttribute('aria-busy')).toBe('true');
    // Default i18n key — `common.loading` → "Cargando…".
    expect(status.getAttribute('aria-label')).toBe('Cargando…');
  });

  it('ErrorState announces as role="alert" with aria-live="polite"', () => {
    renderWithProviders(
      <ErrorState title="Error" body="Algo salió mal" retryLabel="Reintentar" onRetry={() => {}} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.getAttribute('aria-live')).toBe('polite');
  });

  it('SectionTitle announces its title as role="heading" with aria-level=2', () => {
    renderWithProviders(<SectionTitle title="Ventas hoy" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('Ventas hoy');
  });

  it('Kpi exposes a combined aria-label on the root', () => {
    renderWithProviders(<Kpi label="Margen Operativo" value="$1,250,000.00" />);
    const kpi = screen.getByTestId('kpi');
    expect(kpi.getAttribute('aria-label')).toBe('Margen Operativo: $1,250,000.00');
  });

  it('Kpi includes the hint in the combined aria-label when supplied', () => {
    renderWithProviders(<Kpi label="Ventas hoy" value="$8,450.00" hint="vs. ayer +12%" />);
    const kpi = screen.getByTestId('kpi');
    expect(kpi.getAttribute('aria-label')).toBe('Ventas hoy: $8,450.00 (vs. ayer +12%)');
  });

  it('Gauge declares role="meter" with aria-valuenow/min/max/text', () => {
    renderWithProviders(<Gauge label="Margen bruto" value={60} max={100} />);
    const meter = screen.getByRole('meter');
    expect(meter).toBeInTheDocument();
    expect(meter.getAttribute('aria-valuenow')).toBe('60');
    expect(meter.getAttribute('aria-valuemin')).toBe('0');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
    expect(meter.getAttribute('aria-valuetext')).toBe('60%');
    // Combined label includes the human-readable label so SR users
    // hear "Margen bruto: 60%" instead of just "60 percent".
    expect(meter.getAttribute('aria-label')).toBe('Margen bruto: 60%');
  });

  it('PeriodPicker tabs render as role="radiogroup" + role="radio" with aria-checked mirroring selection', () => {
    const initial: PeriodoState = {
      mode: 'mensual',
      year: '2026',
      month: '04',
      from: '',
      to: '',
    };
    renderWithProviders(<PeriodPicker value={initial} onChange={() => {}} labels={periodLabels} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    // The `mensual` chip is selected → aria-checked="true"; the
    // others stay false.
    const mensualChip = screen.getByTestId('period-picker-tab-mensual');
    const anualChip = screen.getByTestId('period-picker-tab-anual');
    const rangoChip = screen.getByTestId('period-picker-tab-rango');
    expect(mensualChip.getAttribute('aria-checked')).toBe('true');
    expect(anualChip.getAttribute('aria-checked')).toBe('false');
    expect(rangoChip.getAttribute('aria-checked')).toBe('false');
  });

  it('List (web) declares role="list" on the root container', () => {
    renderWithProviders(
      <List
        data={[{ id: 'a' }, { id: 'b' }]}
        renderItem={(item) => <div data-testid={`row-${item.id}`}>{item.id}</div>}
        keyExtractor={(item) => item.id}
      />,
    );
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getByTestId('row-a')).toBeInTheDocument();
    expect(screen.getByTestId('row-b')).toBeInTheDocument();
  });
});
