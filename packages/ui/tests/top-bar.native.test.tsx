import { describe, expect, it, vi } from 'vitest';
import { TopBar } from '../src/components/TopBar/top-bar.native';
import { renderWithProviders, screen } from './test-utils';

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 0, left: 0 }),
}));

describe('TopBar (native variant)', () => {
  it('applies the safe-area top inset on mobile', () => {
    renderWithProviders(<TopBar title="Ventas" />);

    expect(getComputedStyle(screen.getByTestId('top-bar')).paddingTop).toBe('24px');
  });
});
