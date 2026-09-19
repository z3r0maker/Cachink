/**
 * RolePicker component tests (P1C-M1-T01).
 *
 * The screen is a presentation-only primitive — no store access, no
 * navigation, just two tappable cards and an `onSelect` callback. Tests
 * cover the contract consumers rely on:
 *   - Renders both role options with their localized labels.
 *   - Invokes `onSelect` with the matching role when either Btn is pressed.
 *   - Forwards `testID` so Maestro E2E flows can anchor to it.
 */

import { describe, expect, it, vi } from 'vitest';
import { RolePicker } from '../../src/screens/RolePicker/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

// Ensure i18n is initialized before the first render — the module is
// idempotent so calling again in other tests is safe.
initI18n();

describe('RolePicker', () => {
  it('renders the greeting, subtitle, and both role cards', () => {
    renderWithProviders(<RolePicker onSelect={vi.fn()} />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
    expect(screen.getByText('¿Con qué rol vas a trabajar hoy?')).toBeInTheDocument();
    expect(screen.getByTestId('role-operativo')).toBeInTheDocument();
    expect(screen.getByTestId('role-director')).toBeInTheDocument();
  });

  it('fires onSelect with `operativo` when the Operativo card is tapped', () => {
    const onSelect = vi.fn();
    renderWithProviders(<RolePicker onSelect={onSelect} />);
    const button = screen.getAllByTestId('role-operativo-select')[0]!;
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('operativo');
  });

  it('fires onSelect with `director` when the Director card is tapped', () => {
    const onSelect = vi.fn();
    renderWithProviders(<RolePicker onSelect={onSelect} />);
    const button = screen.getAllByTestId('role-director-select')[0]!;
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith('director');
  });

  it('forwards testID to the root so E2E tests can anchor', () => {
    renderWithProviders(<RolePicker onSelect={vi.fn()} testID="role-picker-root" />);
    expect(screen.getByTestId('role-picker-root')).toBeInTheDocument();
  });
});
