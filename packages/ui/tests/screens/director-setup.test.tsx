/**
 * DirectorSetupScreen tests — first-run Director account creation.
 *
 * Covers form rendering, PIN validation, confirm-PIN matching,
 * submit gating, and callback wiring.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { DirectorSetupScreen } from '../../src/screens/DirectorSetup/director-setup-screen';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const defaultProps = {
  onSubmit: vi.fn(),
  submitting: false,
};

function renderSetup(overrides: Partial<typeof defaultProps> = {}) {
  return renderWithProviders(
    <DirectorSetupScreen {...defaultProps} {...overrides} />,
  );
}

function fillInput(testId: string, value: string): void {
  const wrapper = screen.getByTestId(testId);
  const input = wrapper.querySelector('input')!;
  fireEvent.change(input, { target: { value } });
}

describe('DirectorSetupScreen', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders with default testID director-setup', () => {
    renderSetup();
    expect(screen.getByTestId('director-setup')).toBeInTheDocument();
  });

  it('renders nombre field', () => {
    renderSetup();
    expect(screen.getByTestId('director-nombre')).toBeInTheDocument();
  });

  it('renders PIN and confirm PIN fields', () => {
    renderSetup();
    expect(screen.getByTestId('director-pin')).toBeInTheDocument();
    expect(screen.getByTestId('director-confirm-pin')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderSetup();
    expect(screen.getByTestId('director-setup-submit')).toBeInTheDocument();
  });

  it('does not submit when form is empty', () => {
    const onSubmit = vi.fn();
    renderSetup({ onSubmit });
    fireEvent.click(screen.getByTestId('director-setup-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits when all fields are valid', () => {
    const onSubmit = vi.fn();
    renderSetup({ onSubmit });
    fillInput('director-nombre', 'Ana Director');
    fillInput('director-pin', '123456');
    fillInput('director-confirm-pin', '123456');
    fireEvent.click(screen.getByTestId('director-setup-submit'));
    expect(onSubmit).toHaveBeenCalledWith({
      nombre: 'Ana Director',
      pin: '123456',
      recoveryPassword: '123456',
    });
  });

  it('does not submit when PINs do not match', () => {
    const onSubmit = vi.fn();
    renderSetup({ onSubmit });
    fillInput('director-nombre', 'Ana Director');
    fillInput('director-pin', '123456');
    fillInput('director-confirm-pin', '654321');
    fireEvent.click(screen.getByTestId('director-setup-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when PIN is too short', () => {
    const onSubmit = vi.fn();
    renderSetup({ onSubmit });
    fillInput('director-nombre', 'Ana Director');
    fillInput('director-pin', '123');
    fillInput('director-confirm-pin', '123');
    fireEvent.click(screen.getByTestId('director-setup-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit when nombre is empty', () => {
    const onSubmit = vi.fn();
    renderSetup({ onSubmit });
    fillInput('director-pin', '123456');
    fillInput('director-confirm-pin', '123456');
    fireEvent.click(screen.getByTestId('director-setup-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <DirectorSetupScreen {...defaultProps} testID="my-setup" />,
    );
    expect(screen.getByTestId('my-setup')).toBeInTheDocument();
  });
});
