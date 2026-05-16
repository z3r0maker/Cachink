import { describe, expect, it } from 'vitest';
import { HelpAccordion } from '../../src/components/HelpAccordion/index';
import { initI18n } from '../../src/i18n/index';
import { renderWithProviders, screen, fireEvent } from '../test-utils';

initI18n();

describe('HelpAccordion', () => {
  const baseProps = {
    subtitle: 'Lo que ganaste menos lo que costó producirlo',
    detail: 'Si vendiste un pastel por $200 y la harina costó $80, tu utilidad bruta es $120.',
  };

  it('renders the subtitle text', () => {
    renderWithProviders(<HelpAccordion {...baseProps} />);
    expect(screen.getByText(baseProps.subtitle)).toBeInTheDocument();
  });

  it('does not show the detail by default', () => {
    renderWithProviders(<HelpAccordion {...baseProps} />);
    expect(screen.queryByTestId('help-accordion-detail')).toBeNull();
  });

  it('shows the detail when defaultOpen is true', () => {
    renderWithProviders(<HelpAccordion {...baseProps} defaultOpen />);
    expect(screen.getByTestId('help-accordion-detail')).toBeInTheDocument();
    expect(screen.getByText(baseProps.detail)).toBeInTheDocument();
  });

  it('toggles the detail on trigger press', () => {
    renderWithProviders(<HelpAccordion {...baseProps} />);
    const trigger = screen.getByTestId('help-accordion-trigger');

    // Open
    fireEvent.click(trigger);
    expect(screen.getByTestId('help-accordion-detail')).toBeInTheDocument();

    // Close
    fireEvent.click(trigger);
    // AnimatePresence may keep the element briefly; check aria-expanded
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-expanded on the trigger', () => {
    renderWithProviders(<HelpAccordion {...baseProps} />);
    const trigger = screen.getByTestId('help-accordion-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('sets role="button" on the trigger', () => {
    renderWithProviders(<HelpAccordion {...baseProps} />);
    const trigger = screen.getByTestId('help-accordion-trigger');
    expect(trigger.getAttribute('role')).toBe('button');
  });

  it('sets role="region" on the detail', () => {
    renderWithProviders(<HelpAccordion {...baseProps} defaultOpen />);
    const detail = screen.getByTestId('help-accordion-detail');
    expect(detail.getAttribute('role')).toBe('region');
  });

  it('supports a custom testID', () => {
    renderWithProviders(<HelpAccordion {...baseProps} testID="custom-help" />);
    expect(screen.getByTestId('custom-help')).toBeInTheDocument();
  });
});
