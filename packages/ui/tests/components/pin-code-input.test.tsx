/**
 * PinCodeInput unit tests.
 *
 * Verifies the OTP-style 6-digit masked PIN entry component:
 * box rendering, digit masking, input filtering, auto-complete,
 * active-box highlighting, and error state.
 */

import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { PinCodeInput, type PinCodeInputProps } from '../../src/components/PinCodeInput/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import { colors } from '../../src/theme';

initI18n();

/** Controlled wrapper so onChange updates the rendered value. */
function Wrapper(props: Omit<PinCodeInputProps, 'value' | 'onChange'> & { initial?: string }): React.ReactElement {
  const [value, setValue] = useState(props.initial ?? '');
  return (
    <PinCodeInput
      value={value}
      onChange={setValue}
      onComplete={props.onComplete}
      error={props.error}
      testID={props.testID}
    />
  );
}

describe('PinCodeInput', () => {
  it('renders 6 empty boxes initially', () => {
    renderWithProviders(<PinCodeInput value="" onChange={vi.fn()} testID="pin" />);
    expect(screen.getByTestId('pin')).toBeInTheDocument();
    // No dots should be present
    expect(screen.queryByText('●')).not.toBeInTheDocument();
  });

  it('renders masked dots for each entered digit', () => {
    renderWithProviders(<PinCodeInput value="123" onChange={vi.fn()} testID="pin" />);
    const dots = screen.getAllByText('●');
    expect(dots).toHaveLength(3);
  });

  it('renders 6 dots when fully filled', () => {
    renderWithProviders(<PinCodeInput value="123456" onChange={vi.fn()} testID="pin" />);
    const dots = screen.getAllByText('●');
    expect(dots).toHaveLength(6);
  });

  it('rejects non-digit characters via onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(<PinCodeInput value="" onChange={onChange} testID="pin" />);
    const input = screen.getByTestId('pin-field');
    fireEvent.change(input, { target: { value: 'abc123xyz' } });
    expect(onChange).toHaveBeenCalledWith('123');
  });

  it('clamps to 6 characters max', () => {
    const onChange = vi.fn();
    renderWithProviders(<PinCodeInput value="" onChange={onChange} testID="pin" />);
    const input = screen.getByTestId('pin-field');
    fireEvent.change(input, { target: { value: '12345678' } });
    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('fires onComplete when 6th digit is entered', () => {
    const onComplete = vi.fn();
    renderWithProviders(<Wrapper onComplete={onComplete} initial="12345" />);
    const input = screen.getByTestId('pin-input-field');
    fireEvent.change(input, { target: { value: '123456' } });
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('does NOT fire onComplete with fewer than 6 digits', () => {
    const onComplete = vi.fn();
    renderWithProviders(<Wrapper onComplete={onComplete} />);
    const input = screen.getByTestId('pin-input-field');
    fireEvent.change(input, { target: { value: '12345' } });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('applies error border color when error is true', () => {
    const { container } = renderWithProviders(
      <PinCodeInput value="12" onChange={vi.fn()} error testID="pin" />,
    );
    // Tamagui compiles #FF4757 → class names like _btc-FF4757*.
    // The hex digits (without #) appear in the compiled class names.
    const redHex = colors.red.replace('#', '');
    const html = container.innerHTML;
    expect(html).toContain(redHex);
  });

  it('does not apply error border when error is false', () => {
    const { container } = renderWithProviders(
      <PinCodeInput value="12" onChange={vi.fn()} error={false} testID="pin" />,
    );
    // Without error, the red hex should NOT appear in border classes.
    const redHex = colors.red.replace('#', '');
    const html = container.innerHTML;
    expect(html).not.toContain(redHex);
  });

  it('backspace removes the last digit', () => {
    const onComplete = vi.fn();
    renderWithProviders(<Wrapper onComplete={onComplete} initial="123" />);
    const input = screen.getByTestId('pin-input-field');
    // Simulate backspace by changing to shorter value
    fireEvent.change(input, { target: { value: '12' } });
    const dots = screen.getAllByText('●');
    expect(dots).toHaveLength(2);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('forwards testID to the root container', () => {
    renderWithProviders(<PinCodeInput value="" onChange={vi.fn()} testID="custom-pin" />);
    expect(screen.getByTestId('custom-pin')).toBeInTheDocument();
  });

  it('derives hidden input testID from root testID', () => {
    renderWithProviders(<PinCodeInput value="" onChange={vi.fn()} testID="pin-input" />);
    expect(screen.getByTestId('pin-input-field')).toBeInTheDocument();
  });
});
