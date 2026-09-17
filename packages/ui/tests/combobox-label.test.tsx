/**
 * Combobox label + note — both variants render the documented `label`
 * (above the trigger) and `note` (below it), like `Input` does.
 */

import { describe, it, expect } from 'vitest';
import { Combobox as WebCombobox } from '../src/components/Combobox/combobox';
import { Combobox as NativeCombobox } from '../src/components/Combobox/combobox.native';
import { renderWithProviders, screen } from './test-utils';

const OPTIONS = [
  { key: 'a', label: 'Uno' },
  { key: 'b', label: 'Dos' },
] as const;

describe.each([
  ['web', WebCombobox],
  ['native', NativeCombobox],
] as const)('Combobox (%s) label and note', (_name, Combobox) => {
  it('renders the label above the trigger', () => {
    renderWithProviders(
      <Combobox value="" options={OPTIONS} onChange={() => undefined} label="Empleado" />,
    );
    expect(screen.getByText('Empleado')).toBeInTheDocument();
  });

  it('renders the note below the trigger', () => {
    renderWithProviders(
      <Combobox value="" options={OPTIONS} onChange={() => undefined} note="Elige un empleado" />,
    );
    expect(screen.getByText('Elige un empleado')).toBeInTheDocument();
  });

  it('renders neither when both are omitted', () => {
    renderWithProviders(<Combobox value="a" options={OPTIONS} onChange={() => undefined} />);
    expect(screen.queryByText('Empleado')).toBeNull();
    expect(screen.getAllByText('Uno').length).toBeGreaterThan(0);
  });
});
