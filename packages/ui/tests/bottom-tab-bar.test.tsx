import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BottomTabBar, type BottomTabBarItem } from '../src/components/BottomTabBar/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

const noop = (): void => {};

function makeItems(count: number): BottomTabBarItem[] {
  return Array.from({ length: count }, (_v, i) => ({
    key: `tab${i}`,
    label: `Tab${i}`,
    onPress: noop,
  }));
}

describe('BottomTabBar', () => {
  it('renders 3 items (Operativo case)', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop },
          { key: 'inventario', label: 'Inventario', onPress: noop },
        ]}
      />,
    );
    expect(screen.getByText('Ventas')).toBeDefined();
    expect(screen.getByText('Egresos')).toBeDefined();
    expect(screen.getByText('Inventario')).toBeDefined();
  });

  it('renders 6 items (Director case)', () => {
    renderWithProviders(<BottomTabBar activeKey="tab0" items={makeItems(6)} />);
    for (let i = 0; i < 6; i++) {
      expect(screen.getByText(`Tab${i}`)).toBeDefined();
    }
  });

  it('renders a yellow active strip pinned to the top of the active tab cell', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop },
        ]}
      />,
    );
    const ventas = screen.getAllByTestId('tab-ventas')[0]!;
    // The active cell itself stays transparent — the yellow surface
    // moves to a 4-px strip that lives inside it (per ADR-040).
    const cellBg = getComputedStyle(ventas).backgroundColor.toLowerCase();
    expect(cellBg === 'transparent' || cellBg.includes('rgba(0, 0, 0, 0)') || cellBg === '').toBe(
      true,
    );
    const strip = screen.getAllByTestId('tab-item-active-strip')[0]!;
    expect(getComputedStyle(strip).backgroundColor.toLowerCase()).toContain('rgb(255, 214, 10)');
  });

  it('does not render the active strip on inactive tabs', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop },
        ]}
      />,
    );
    // Exactly one strip on the active cell, none elsewhere.
    expect(screen.getAllByTestId('tab-item-active-strip').length).toBe(1);
  });

  it('renders the inactive tab with a transparent background', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop },
        ]}
      />,
    );
    const egresos = screen.getAllByTestId('tab-egresos')[0]!;
    const bg = getComputedStyle(egresos).backgroundColor.toLowerCase();
    // Tamagui resolves "transparent" to either "transparent" or "rgba(0, 0, 0, 0)".
    expect(bg === 'transparent' || bg.includes('rgba(0, 0, 0, 0)') || bg === '').toBe(true);
  });

  it('fires onPress when an inactive tab is pressed', () => {
    const onEgresosPress = vi.fn();
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: onEgresosPress },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByTestId('tab-egresos')[0]!);
    expect(onEgresosPress).toHaveBeenCalledTimes(1);
  });

  it('fires onPress even when the active tab is pressed (re-tap is supported)', () => {
    const onVentasPress = vi.fn();
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          { key: 'ventas', label: 'Ventas', onPress: onVentasPress },
          { key: 'egresos', label: 'Egresos', onPress: noop },
        ]}
      />,
    );
    fireEvent.click(screen.getAllByTestId('tab-ventas')[0]!);
    expect(onVentasPress).toHaveBeenCalledTimes(1);
  });

  it('renders the badge when provided', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="home"
        items={[
          { key: 'home', label: 'Home', onPress: noop },
          { key: 'egresos', label: 'Egresos', onPress: noop, badge: 3 },
        ]}
      />,
    );
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getAllByTestId('tab-item-badge').length).toBe(1);
  });

  it('does not render a badge when omitted', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[{ key: 'ventas', label: 'Ventas', onPress: noop }]}
      />,
    );
    expect(screen.queryByTestId('tab-item-badge')).toBeNull();
  });

  it('renders the icon slot when provided', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[
          {
            key: 'ventas',
            label: 'Ventas',
            icon: <span data-testid="vento-icon">💰</span>,
            onPress: noop,
          },
        ]}
      />,
    );
    expect(screen.getAllByTestId('tab-item-icon').length).toBeGreaterThan(0);
    expect(screen.getByTestId('vento-icon')).toBeDefined();
  });

  it('omits the icon wrapper when no icon is supplied', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[{ key: 'ventas', label: 'Ventas', onPress: noop }]}
      />,
    );
    expect(screen.queryByTestId('tab-item-icon')).toBeNull();
  });

  describe('out-of-range guard', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('warns and renders nothing when items is empty', () => {
      renderWithProviders(<BottomTabBar activeKey="x" items={[]} />);
      expect(warnSpy).toHaveBeenCalledOnce();
    });

    it('warns and clamps to the first 6 when more than 6 items are passed', () => {
      renderWithProviders(<BottomTabBar activeKey="tab0" items={makeItems(8)} />);
      expect(warnSpy).toHaveBeenCalledOnce();
      // First 6 rendered, 7..8 dropped.
      expect(screen.getByText('Tab5')).toBeDefined();
      expect(screen.queryByText('Tab6')).toBeNull();
      expect(screen.queryByText('Tab7')).toBeNull();
    });
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(
      <BottomTabBar
        activeKey="ventas"
        items={[{ key: 'ventas', label: 'Ventas', onPress: noop }]}
        testID="operativo-tabbar"
      />,
    );
    expect(screen.getAllByTestId('operativo-tabbar').length).toBeGreaterThan(0);
  });
});
