import { describe, it, expect, vi } from 'vitest';
import { Card } from '../src/components/Card/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';

describe('Card', () => {
  it('renders its children', () => {
    renderWithProviders(
      <Card>
        <span>contenido de prueba</span>
      </Card>,
    );
    expect(screen.getByText('contenido de prueba')).toBeDefined();
  });

  it('applies white surface tokens by default', () => {
    renderWithProviders(
      <Card testID="card-default">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-default')[0]!;
    const styles = getComputedStyle(root);
    // white (#FFFFFF) → rgb(255, 255, 255).
    expect(styles.backgroundColor.toLowerCase()).toContain(
      'rgb(255, 255, 255)',
    );
    // 2px black border per §8.3.
    expect(styles.borderTopWidth).toBe('2px');
  });

  it('applies the yellow variant background', () => {
    renderWithProviders(
      <Card variant="yellow" testID="card-yellow">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-yellow')[0]!;
    // yellow (#FFD60A) → rgb(255, 214, 10).
    expect(getComputedStyle(root).backgroundColor.toLowerCase()).toContain(
      'rgb(255, 214, 10)',
    );
  });

  it('applies the black variant with 2.5px border and hero shadow', () => {
    renderWithProviders(
      <Card variant="black" testID="card-black">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-black')[0]!;
    const styles = getComputedStyle(root);
    // black (#0D0D0D) → rgb(13, 13, 13).
    expect(styles.backgroundColor.toLowerCase()).toContain('rgb(13, 13, 13)');
    expect(styles.borderTopWidth).toBe('2.5px');
    // hero shadow is the 5×5 hard drop shadow.
    expect(styles.boxShadow).toContain('5px 5px 0');
  });

  it('uses md (16) padding by default', () => {
    renderWithProviders(
      <Card testID="card-pad-default">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-pad-default')[0]!;
    expect(getComputedStyle(root).paddingTop).toBe('16px');
  });

  it('honors each padding token (none / sm / md / lg)', () => {
    const cases: Array<['none' | 'sm' | 'md' | 'lg', string]> = [
      ['none', '0px'],
      ['sm', '12px'],
      ['md', '16px'],
      ['lg', '24px'],
    ];
    for (const [padding, expected] of cases) {
      renderWithProviders(
        <Card padding={padding} testID={`card-pad-${padding}`}>
          <span>x</span>
        </Card>,
      );
      const root = screen.getAllByTestId(`card-pad-${padding}`)[0]!;
      expect(getComputedStyle(root).paddingTop).toBe(expected);
    }
  });

  it('fires onPress when tapped', () => {
    const onPress = vi.fn();
    renderWithProviders(
      <Card onPress={onPress} testID="card-tappable">
        <span>x</span>
      </Card>,
    );
    fireEvent.click(screen.getAllByTestId('card-tappable')[0]!);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is inert when onPress is omitted (no cursor:pointer)', () => {
    renderWithProviders(
      <Card testID="card-inert">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-inert')[0]!;
    expect(getComputedStyle(root).cursor).not.toBe('pointer');
  });

  it('respects the fullWidth flag', () => {
    renderWithProviders(
      <Card fullWidth testID="card-full">
        <span>x</span>
      </Card>,
    );
    const root = screen.getAllByTestId('card-full')[0]!;
    const { width } = getComputedStyle(root);
    expect(width === '100%' || width.endsWith('px')).toBe(true);
  });

  it('forwards testID so E2E tests can anchor to it', () => {
    renderWithProviders(
      <Card testID="venta-card">
        <span>x</span>
      </Card>,
    );
    expect(screen.getAllByTestId('venta-card').length).toBeGreaterThan(0);
  });
});
