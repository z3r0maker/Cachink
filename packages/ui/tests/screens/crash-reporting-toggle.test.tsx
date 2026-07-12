/**
 * CrashReportingToggle unit test.
 */

import { describe, it, expect, vi } from 'vitest';
import { CrashReportingToggle } from '../../src/screens/Settings/crash-reporting-toggle';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('CrashReportingToggle', () => {
  it('renders with enabled state', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CrashReportingToggle enabled={true} onChange={onChange} />,
    );
    expect(screen.getByTestId('settings-crash-reporting-toggle')).toBeTruthy();
    expect(screen.getByTestId('settings-crash-reporting-btn')).toBeTruthy();
  });

  it('calls onChange with inverted value on press', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CrashReportingToggle enabled={true} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('settings-crash-reporting-btn'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('calls onChange(true) when disabled and pressed', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <CrashReportingToggle enabled={false} onChange={onChange} />,
    );
    fireEvent.click(screen.getByTestId('settings-crash-reporting-btn'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
