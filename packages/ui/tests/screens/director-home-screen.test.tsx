/**
 * DirectorHomeScreen tests (P1C-M10-T01, S4-C1).
 *
 * The shell is pure presentation: greeting + hero slot + responsive
 * grid. Tests verify:
 *   - Renders the default greeting from i18n when no prop passed.
 *   - Renders a custom greeting when `greeting` prop is provided.
 *   - Renders each slot when its prop is set.
 *   - Omits a slot entirely when its prop is undefined (no empty grid cell).
 *   - Forwards `testID` so Maestro can anchor.
 *   - Audit M-1 PR 5.5-T03 — grid column count flips 1 → 2 → 3
 *     across the breakpoint ladder.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { DirectorHomeScreen } from '../../src/screens/DirectorHome/director-home-screen';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen } from '../test-utils';
import { resetMockViewport, setMockViewport } from '../responsive/match-media-mock';

initI18n();

describe('DirectorHomeScreen', () => {
  it('renders the default greeting when no prop is provided', () => {
    renderWithProviders(<DirectorHomeScreen />);
    expect(screen.getByText('Hola, Director')).toBeInTheDocument();
  });

  it('renders a custom greeting when prop is provided', () => {
    renderWithProviders(<DirectorHomeScreen greeting="¡Buen día, Ana!" />);
    expect(screen.getByText('¡Buen día, Ana!')).toBeInTheDocument();
  });

  it('renders every slot when its prop is set', () => {
    renderWithProviders(
      <DirectorHomeScreen
        hero={<div data-testid="hero">Hero</div>}
        hoy={<div data-testid="hoy">Hoy</div>}
        cxc={<div data-testid="cxc">CxC</div>}
        actividad={<div data-testid="actividad">Actividad</div>}
        stockBajo={<div data-testid="stock">Stock</div>}
        pendientes={<div data-testid="pendientes">Pendientes</div>}
      />,
    );
    expect(screen.getByTestId('hero')).toBeInTheDocument();
    expect(screen.getByTestId('hoy')).toBeInTheDocument();
    expect(screen.getByTestId('cxc')).toBeInTheDocument();
    expect(screen.getByTestId('actividad')).toBeInTheDocument();
    expect(screen.getByTestId('stock')).toBeInTheDocument();
    expect(screen.getByTestId('pendientes')).toBeInTheDocument();
  });

  it('omits a slot entirely when its prop is undefined', () => {
    renderWithProviders(<DirectorHomeScreen hoy={<div data-testid="hoy">Hoy</div>} />);
    expect(screen.getByTestId('hoy')).toBeInTheDocument();
    expect(screen.queryByTestId('director-home-hero-slot')).toBeNull();
  });

  it('forwards testID to the root', () => {
    renderWithProviders(<DirectorHomeScreen testID="dh-root" />);
    expect(screen.getByTestId('dh-root')).toBeInTheDocument();
  });

  describe('grid column count (PR 5.5-T03 useMedia ladder)', () => {
    afterEach(() => {
      resetMockViewport();
    });

    function renderWithSlots(testID: string): HTMLElement {
      renderWithProviders(
        <DirectorHomeScreen
          testID={testID}
          hoy={<div data-testid="hoy">Hoy</div>}
          cxc={<div data-testid="cxc">CxC</div>}
          actividad={<div data-testid="actividad">Actividad</div>}
        />,
      );
      return screen.getByTestId('director-home-grid');
    }

    it('phone portrait (sm) renders 1 column', () => {
      setMockViewport(360);
      const grid = renderWithSlots('dh-phone');
      expect(grid.getAttribute('data-columns')).toBe('1');
    });

    it('tablet landscape (gtMd) renders 2 columns', () => {
      setMockViewport(900);
      const grid = renderWithSlots('dh-tablet');
      expect(grid.getAttribute('data-columns')).toBe('2');
    });

    it('wide desktop (gtLg) renders 3 columns', () => {
      setMockViewport(1400);
      const grid = renderWithSlots('dh-desktop');
      expect(grid.getAttribute('data-columns')).toBe('3');
    });
  });
});
