/**
 * El Mostrador controls (M-05): chips, segmented tabs and the new buttons.
 */
import { describe, expect, it, vi } from 'vitest';
import { Btn } from '../../src/components/Btn/index';
import { Chip } from '../../src/components/Chip/index';
import { SegmentedTabs } from '../../src/components/SegmentedTabs/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

const YELLOW = 'rgb(255, 214, 10)';
const BLACK = 'rgb(13, 13, 13)';

describe('Chip', () => {
  it('is black with yellow text when selected, never yellow-filled', () => {
    renderWithProviders(<Chip label="Efectivo" selected onPress={vi.fn()} testID="c" />);
    const chip = screen.getByTestId('c');
    expect(chip.getAttribute('aria-checked')).toBe('true');
    expect(getComputedStyle(chip).backgroundColor).toBe(BLACK);
    expect(getComputedStyle(screen.getByText('Efectivo')).color).toBe(YELLOW);
  });

  it('is white with a quiet edge and 44 px tall when not selected', () => {
    renderWithProviders(<Chip label="Tarjeta" selected={false} onPress={vi.fn()} testID="c" />);
    const chip = screen.getByTestId('c');
    expect(getComputedStyle(chip).backgroundColor).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(chip).minHeight).toBe('44px');
    expect(chip.getAttribute('role')).toBe('radio');
  });

  it('fires onPress', () => {
    const onPress = vi.fn();
    renderWithProviders(<Chip label="Fiado" selected={false} onPress={onPress} testID="c" />);
    fireEvent.click(screen.getByTestId('c'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SegmentedTabs', () => {
  const tabs = [
    { key: 'nuevos', label: 'Nuevos', count: 2 },
    { key: 'leidos', label: 'Leídos', count: 5 },
  ] as const;

  it('is a tablist whose selected tab is yellow', () => {
    renderWithProviders(
      <SegmentedTabs tabs={tabs} value="nuevos" onChange={vi.fn()} ariaLabel="Avisos" testID="t" />,
    );
    expect(screen.getByTestId('t').getAttribute('role')).toBe('tablist');
    const sel = screen.getByTestId('t-nuevos');
    expect(sel.getAttribute('aria-selected')).toBe('true');
    expect(getComputedStyle(sel).backgroundColor).toBe(YELLOW);
    expect(getComputedStyle(screen.getByTestId('t-leidos')).backgroundColor).toBe(
      'rgb(255, 255, 255)',
    );
  });

  it('switches only to another tab and names the count', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedTabs
        tabs={tabs}
        value="nuevos"
        onChange={onChange}
        ariaLabel="Avisos"
        testID="t"
      />,
    );
    fireEvent.click(screen.getByTestId('t-nuevos'));
    fireEvent.click(screen.getByTestId('t-leidos'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('leidos');
    expect(screen.getByTestId('t-leidos').getAttribute('aria-label')).toBe('Leídos, 5');
  });
});

describe('Btn · El Mostrador variants', () => {
  it('primary xl is 56 px, yellow, thick black edge, sentence case', () => {
    renderWithProviders(
      <Btn size="xl" onPress={vi.fn()} testID="b">
        Cerrar turno
      </Btn>,
    );
    const b = screen.getByTestId('b');
    const s = getComputedStyle(b);
    expect(s.height).toBe('56px');
    expect(s.backgroundColor).toBe(YELLOW);
    expect(s.borderTopWidth).toBe('2.5px');
    expect(getComputedStyle(screen.getByText('Cerrar turno')).textTransform).not.toBe('uppercase');
  });

  it('secondary is white with the thin black edge', () => {
    renderWithProviders(
      <Btn variant="secondary" onPress={vi.fn()} testID="b">
        Volver
      </Btn>,
    );
    const s = getComputedStyle(screen.getByTestId('b'));
    expect(s.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(s.borderTopColor).toBe(BLACK);
    expect(s.borderTopWidth).toBe('2px');
  });

  it('quiet has the gray edge and gray600 text', () => {
    renderWithProviders(
      <Btn variant="quiet" onPress={vi.fn()} testID="b">
        Ahora no
      </Btn>,
    );
    expect(getComputedStyle(screen.getByTestId('b')).borderTopColor).toBe('rgb(228, 228, 224)');
    expect(getComputedStyle(screen.getByText('Ahora no')).color).toBe('rgb(90, 90, 86)');
  });

  it('destructive is red text on white; the filled one is red with white text', () => {
    renderWithProviders(
      <>
        <Btn variant="destructive" onPress={vi.fn()} testID="d">
          Cancelar venta
        </Btn>
        <Btn variant="destructiveFilled" onPress={vi.fn()} testID="f">
          Sí, cancelar
        </Btn>
      </>,
    );
    expect(getComputedStyle(screen.getByText('Cancelar venta')).color).toBe('rgb(218, 0, 19)');
    expect(getComputedStyle(screen.getByTestId('f')).backgroundColor).toBe('rgb(218, 0, 19)');
    expect(getComputedStyle(screen.getByText('Sí, cancelar')).color).toBe('rgb(255, 255, 255)');
  });

  it('a disabled El Mostrador confirm turns gray100 instead of fading', () => {
    renderWithProviders(
      <Btn variant="destructiveFilled" disabled onPress={vi.fn()} testID="b">
        Sí, cancelar
      </Btn>,
    );
    const s = getComputedStyle(screen.getByTestId('b'));
    expect(s.backgroundColor).toBe('rgb(242, 242, 240)');
    expect(s.opacity).toBe('1');
  });
});
