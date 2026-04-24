/**
 * Wizard component tests (P1C-M2-T03).
 */

import { describe, expect, it, vi } from 'vitest';
import { Wizard } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('Wizard — desktop platform', () => {
  it('renders all 4 mode cards', () => {
    renderWithProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />);
    expect(screen.getByTestId('wizard-local-standalone')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-cloud')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-lan-client')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-lan-host')).toBeInTheDocument();
  });

  it('fires onSelectMode("local-standalone") when the functional card is tapped', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />);
    const card = screen.getAllByTestId('wizard-local-standalone-card')[0]!;
    fireEvent.click(card);
    expect(onSelectMode).toHaveBeenCalledWith('local-standalone');
  });

  it('does not fire onSelectMode when a disabled card is tapped', () => {
    const onSelectMode = vi.fn();
    renderWithProviders(<Wizard onSelectMode={onSelectMode} platform="desktop" />);
    const cloudCard = screen.getAllByTestId('wizard-cloud-card')[0]!;
    const lanCard = screen.getAllByTestId('wizard-lan-client-card')[0]!;
    const hostCard = screen.getAllByTestId('wizard-lan-host-card')[0]!;
    fireEvent.click(cloudCard);
    fireEvent.click(lanCard);
    fireEvent.click(hostCard);
    expect(onSelectMode).not.toHaveBeenCalled();
  });

  it('displays a "Próximamente" chip on each disabled card', () => {
    renderWithProviders(<Wizard onSelectMode={vi.fn()} platform="desktop" />);
    const chips = screen.getAllByText('Próximamente');
    // 3 disabled cards on desktop.
    expect(chips.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Wizard — mobile platform', () => {
  it('hides the "Ser el servidor local" card', () => {
    renderWithProviders(<Wizard onSelectMode={vi.fn()} platform="mobile" />);
    expect(screen.getByTestId('wizard-local-standalone')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-cloud')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-lan-client')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-lan-host')).toBeNull();
  });
});
