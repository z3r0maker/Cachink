import { describe, it, expect, vi } from 'vitest';
import { FAB } from '../src/components/FAB/index';
import { Icon } from '../src/components/Icon/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

/** Same tap-sequence helper used everywhere else in the suite. */
function tap(el: Element): void {
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

describe('FAB', () => {
  it('renders the supplied icon inside a 56-pt circle', () => {
    renderWithProviders(
      <FAB
        icon={<Icon name="plus" size={28} />}
        ariaLabel="Nueva venta"
        onPress={() => undefined}
        testID="fab-nueva-venta"
      />,
    );
    const fab = screen.getAllByTestId('fab-nueva-venta')[0]!;
    expect(fab).toBeInTheDocument();
    expect(fab.getAttribute('aria-label')).toBe('Nueva venta');
    expect(fab.getAttribute('role')).toBe('button');
    // Plus icon rendered inside.
    expect(screen.getAllByTestId('icon-plus').length).toBeGreaterThan(0);
  });

  it('fires onPress when tapped', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <FAB icon={<Icon name="plus" size={28} />} ariaLabel="Nuevo egreso" onPress={onPress} />,
    );
    tap(screen.getAllByTestId('fab')[0]!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('rejects taps and dims when disabled', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <FAB
        icon={<Icon name="plus" size={28} />}
        ariaLabel="Nuevo cliente"
        onPress={onPress}
        disabled
        testID="fab-disabled"
      />,
    );
    const fab = screen.getAllByTestId('fab-disabled')[0]!;
    tap(fab);
    expect(onPress).not.toHaveBeenCalled();
    expect(fab.getAttribute('aria-disabled')).toBe('true');
  });

  it('exposes default position above the bottom-tab bar', () => {
    renderWithProviders(
      <FAB
        icon={<Icon name="plus" size={28} />}
        ariaLabel="Nuevo"
        onPress={() => undefined}
        testID="fab-default-pos"
      />,
    );
    const fab = screen.getAllByTestId('fab-default-pos')[0]!;
    const styles = window.getComputedStyle(fab);
    // Tamagui maps `position="absolute"` + `bottom={88}` + `right={24}`
    // to inline styles on web. Assert they applied.
    expect(styles.position).toBe('absolute');
    expect(styles.bottom).toBe('88px');
    expect(styles.right).toBe('24px');
  });

  // Audit Round 2 G4: top-up below-floor coverage.

  it('honours custom bottom / right offsets when stacking two FABs on the same screen', () => {
    renderWithProviders(
      <FAB
        icon={<Icon name="camera" size={28} />}
        ariaLabel="Escanear"
        onPress={() => undefined}
        bottom={160}
        right={32}
        testID="fab-custom-pos"
      />,
    );
    const fab = screen.getAllByTestId('fab-custom-pos')[0]!;
    const styles = window.getComputedStyle(fab);
    expect(styles.bottom).toBe('160px');
    expect(styles.right).toBe('32px');
  });

  it('renders the default testID `fab` when none is supplied', () => {
    renderWithProviders(
      <FAB icon={<Icon name="plus" size={28} />} ariaLabel="Default" onPress={() => undefined} />,
    );
    // No explicit testID — primitive must default to `fab` so smoke
    // tests / E2E flows can locate it without coordinating per-screen
    // anchors.
    expect(screen.getAllByTestId('fab').length).toBeGreaterThan(0);
  });
});
