/**
 * `<SwipeableRow>` tests — Phase C2 (audit M-1 PR 4.5-T09).
 *
 * Covers the **web variant** (the default `./swipeable-row.tsx →
 * ./swipeable-row.web.tsx` chain). The web variant is a deliberate
 * passthrough — desktop's affordance is a right-click context menu,
 * out of scope for this primitive. The native variant
 * (gesture-handler-backed) is verified via Maestro mobile E2E,
 * matching the Scanner.native pattern.
 *
 * Coverage:
 *   1. Default testID + children render
 *   2. Custom testID
 *   3. ariaLabel propagates to the root
 *   4. Renders children regardless of `disabled` flag
 *   5. Renders children when neither swipe handler is set (passthrough)
 */

import { describe, expect, it, vi } from 'vitest';
import { SwipeableRow } from '../src/components/SwipeableRow/index';
import { renderWithProviders, screen } from './test-utils';

describe('SwipeableRow (web variant)', () => {
  it('exposes the default testID and renders the child content', () => {
    renderWithProviders(
      <SwipeableRow onSwipeLeft={vi.fn()} onSwipeRight={vi.fn()} ariaLabel="Desliza">
        <span data-testid="row-child">Pan dulce</span>
      </SwipeableRow>,
    );
    expect(screen.getByTestId('swipeable-row')).toBeInTheDocument();
    expect(screen.getByTestId('row-child').textContent).toBe('Pan dulce');
  });

  it('forwards a custom testID to the root', () => {
    renderWithProviders(
      <SwipeableRow testID="venta-row" onSwipeLeft={vi.fn()}>
        <span>Row</span>
      </SwipeableRow>,
    );
    expect(screen.getByTestId('venta-row')).toBeInTheDocument();
  });

  it('propagates ariaLabel to the root for screen-readers', () => {
    renderWithProviders(
      <SwipeableRow
        testID="row-aria"
        onSwipeLeft={vi.fn()}
        onSwipeRight={vi.fn()}
        ariaLabel="Desliza para editar o eliminar"
      >
        <span>Row</span>
      </SwipeableRow>,
    );
    const root = screen.getByTestId('row-aria');
    expect(root.getAttribute('aria-label')).toBe('Desliza para editar o eliminar');
  });

  it('renders children verbatim when disabled (web variant is already a passthrough; disabled has no extra effect)', () => {
    renderWithProviders(
      <SwipeableRow disabled onSwipeLeft={vi.fn()} onSwipeRight={vi.fn()}>
        <span data-testid="disabled-child">Disabled</span>
      </SwipeableRow>,
    );
    expect(screen.getByTestId('disabled-child').textContent).toBe('Disabled');
  });

  it('renders children when neither swipe handler is set (decorative wrapper)', () => {
    renderWithProviders(
      <SwipeableRow testID="decorative-row">
        <span data-testid="decorative-child">No swipe</span>
      </SwipeableRow>,
    );
    expect(screen.getByTestId('decorative-row')).toBeInTheDocument();
    expect(screen.getByTestId('decorative-child').textContent).toBe('No swipe');
  });
});
