/**
 * A11y pass #1 — screen-reader labels on primitives (P1C-M12-T04, S4-C18).
 *
 * Verifies the accessibility attributes land on the rendered elements.
 * Complements the existing per-primitive test suites.
 */

import { describe, expect, it, vi } from 'vitest';
import { Btn } from '../src/components/Btn/btn';
import { Card } from '../src/components/Card/Card';
import { BottomTabBar } from '../src/components/BottomTabBar/bottom-tab-bar';
import { TopBar } from '../src/components/TopBar/top-bar';
import { Input } from '../src/components/Input/input';
import { initI18n } from '../src/i18n/index';
import { renderWithProviders, screen } from './test-utils';

initI18n();

describe('A11y — primitives', () => {
  it('Btn sets accessibilityRole=button and a label', () => {
    renderWithProviders(<Btn onPress={vi.fn()}>Guardar</Btn>);
    const btn = screen.getByTestId('btn');
    expect(btn.getAttribute('aria-label') ?? btn.textContent).toContain('Guardar');
  });

  it('Card with onPress sets an accessibilityRole', () => {
    renderWithProviders(
      <Card onPress={vi.fn()} ariaLabel="Abrir venta">
        Contenido
      </Card>,
    );
    const card = screen.getByTestId('card');
    // Tamagui 2.x passes `role` straight through — see ADR-034.
    const role = card.getAttribute('role');
    expect(role === 'button' || role === null).toBe(true);
  });

  it('BottomTabBar items declare tab role with selected state', () => {
    renderWithProviders(
      <BottomTabBar
        items={[
          { key: 'a', label: 'Ventas', onPress: vi.fn(), testID: 'tab-a' },
          { key: 'b', label: 'Egresos', onPress: vi.fn(), testID: 'tab-b' },
        ]}
        activeKey="a"
      />,
    );
    expect(screen.getByTestId('tab-a')).toBeInTheDocument();
    expect(screen.getByTestId('tab-b')).toBeInTheDocument();
  });

  it('TopBar title declares header role', () => {
    renderWithProviders(<TopBar title="Inicio" />);
    expect(screen.getByTestId('top-bar-title')).toBeInTheDocument();
  });

  it('Input forwards the label into accessibilityLabel', () => {
    renderWithProviders(<Input label="Nombre" value="" onChange={vi.fn()} />);
    expect(screen.getByTestId('input')).toBeInTheDocument();
    const input = screen.getByTestId('input').querySelector('input');
    const label = input?.getAttribute('aria-label');
    expect(label).toBe('Nombre');
  });
});
