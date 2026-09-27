/**
 * A11y pass #2 — semantic ARIA roles on layout primitives
 * (Audit Round 2, slice G1).
 *
 * Complements `a11y.test.tsx` (which asserts focusable-control labels)
 * by verifying the *semantic* roles screen readers use to build the
 * page outline: `role="status"`, `role="alert"`, `role="heading"`,
 * and `role="list"`.
 *
 * One assertion per primitive — we use `getByRole(...)` (the
 * recommended Testing-Library query) where possible, falling back to
 * `getByTestId` + attribute lookup when the role is on a nested node.
 */

import { describe, expect, it } from 'vitest';
import { ErrorState } from '../src/components/ErrorState/index';
import { List } from '../src/components/List/index';
import { SectionTitle } from '../src/components/SectionTitle/index';
import { Skeleton } from '../src/components/Skeleton/index';
import { initI18n } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

initI18n();

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
