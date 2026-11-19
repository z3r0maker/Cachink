import { describe, expect, it, vi } from 'vitest';
import { BottomTabBar } from '../src/components/BottomTabBar/bottom-tab-bar.native';
import { renderWithProviders, screen } from './test-utils';

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
}));

const items = [
  { key: 'inicio', label: 'Inicio', onPress: () => undefined },
  { key: 'cobrar', label: 'Cobrar', onPress: () => undefined },
];

/**
 * The board's yellow tab reaches the bottom of the bar, so on a phone with a
 * home indicator the tabs run through the safe area and keep their content above it.
 */
describe('BottomTabBar on a phone with a home indicator', () => {
  it('grows by the inset, and every tab runs through it', () => {
    renderWithProviders(<BottomTabBar activeKey="cobrar" items={items} />);
    expect(getComputedStyle(screen.getByTestId('bottom-tab-bar')).height).toBe('98px');
    expect(getComputedStyle(screen.getByTestId('tab-cobrar')).paddingBottom).toBe('34px');
    expect(getComputedStyle(screen.getByTestId('tab-inicio')).paddingBottom).toBe('34px');
  });
});
