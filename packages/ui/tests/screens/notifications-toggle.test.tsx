/**
 * NotificationsToggle tests (P1C-M11-T03, S4-C12).
 */

import { describe, expect, it, vi } from 'vitest';
import { NotificationsToggle } from '../../src/screens/Settings/notifications-toggle';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('NotificationsToggle', () => {
  it('renders the Sí chip when enabled', () => {
    renderWithProviders(<NotificationsToggle enabled={true} onChange={vi.fn()} />);
    expect(screen.getByTestId('settings-notifications-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('settings-notifications-btn').textContent).toBe('Sí');
  });

  it('renders the No chip when disabled', () => {
    renderWithProviders(<NotificationsToggle enabled={false} onChange={vi.fn()} />);
    expect(screen.getByTestId('settings-notifications-btn').textContent).toBe('No');
  });

  it('calls onChange with the toggled value', () => {
    const onChange = vi.fn();
    renderWithProviders(<NotificationsToggle enabled={true} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('settings-notifications-btn')[0]!);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('toggles from No → Sí on second tap', () => {
    const onChange = vi.fn();
    renderWithProviders(<NotificationsToggle enabled={false} onChange={onChange} />);
    fireEvent.click(screen.getAllByTestId('settings-notifications-btn')[0]!);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
