import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { MoneyField, TextField } from '../src/components/fields/index';
import { fireEvent, renderWithProviders, screen } from './test-utils';
import { initI18n } from '../src/i18n/index';
import { keyboardHintsFor } from '../src/components/Input/input-shared';

initI18n();

function inputOf(testID: string): HTMLInputElement {
  const root = screen.getAllByTestId(testID)[0]!;
  const input = root.querySelector('input') as HTMLInputElement | null;
  if (input === null) {
    throw new Error(`No <input> found inside testID="${testID}"`);
  }
  return input;
}

describe('keyboardHintsFor', () => {
  it('emits the email-address keyboard for the email variant', () => {
    const hints = keyboardHintsFor('email');
    expect(hints.keyboardType).toBe('email-address');
    expect(hints.inputMode).toBe('email');
    expect(hints.autoCapitalize).toBe('none');
    expect(hints.autoComplete).toBe('email');
    expect(hints.htmlType).toBe('email');
  });

  it('emits the phone-pad keyboard for the phone variant', () => {
    const hints = keyboardHintsFor('phone');
    expect(hints.keyboardType).toBe('phone-pad');
    expect(hints.inputMode).toBe('tel');
    expect(hints.autoComplete).toBe('tel');
  });

  it('marks password variants as secure with current-password autofill', () => {
    const hints = keyboardHintsFor('password');
    expect(hints.secureTextEntry).toBe(true);
    expect(hints.autoComplete).toBe('current-password');
    expect(hints.autoCapitalize).toBe('none');
    expect(hints.htmlType).toBe('password');
  });

  it('emits the decimal-pad keyboard for the decimal variant', () => {
    const hints = keyboardHintsFor('decimal');
    expect(hints.keyboardType).toBe('decimal-pad');
    expect(hints.inputMode).toBe('decimal');
  });

  it('falls back to plain text for unrecognized variants', () => {
    const hints = keyboardHintsFor('text');
    expect(hints.htmlType).toBe('text');
    expect(hints.secureTextEntry).toBeUndefined();
  });
});

describe('TextField', () => {
  it('renders a labelled text input with the supplied value and forwards onChange', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <TextField label="Concepto" value="Playera" onChange={onChange} testID="text-concept" />,
    );
    const input = inputOf('text-concept');
    expect(input.value).toBe('Playera');
    fireEvent.change(input, { target: { value: 'Playera blanca' } });
    expect(onChange).toHaveBeenCalledWith('Playera blanca');
  });

  it('exposes the variant via data-input-type so platform tests can assert keyboard hints', () => {
    renderWithProviders(<TextField value="" onChange={() => undefined} testID="text-variant" />);
    expect(inputOf('text-variant').getAttribute('data-input-type')).toBe('text');
  });
});

describe('MoneyField', () => {
  it('strips dollar signs and locale-typed commas at the input layer', () => {
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return <MoneyField label="Monto" value={v} onChange={setV} testID="money-row" />;
    }
    renderWithProviders(<Harness />);
    const input = inputOf('money-row');
    fireEvent.change(input, { target: { value: '$1,234.56' } });
    expect(input.value).toBe('1,234.56');
  });

  it('formats the visible value on blur (1234 → 1234.00)', () => {
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return <MoneyField label="Monto" value={v} onChange={setV} testID="money-fmt" />;
    }
    renderWithProviders(<Harness />);
    const input = inputOf('money-fmt');
    fireEvent.change(input, { target: { value: '1234' } });
    fireEvent.blur(input);
    expect(input.value).toBe('1,234.00');
  });

  it('exposes the canonical Money bigint via onValueChange while the user types', () => {
    const onValueChange = vi.fn();
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return (
        <MoneyField
          label="Monto"
          value={v}
          onChange={setV}
          onValueChange={onValueChange}
          testID="money-bigint"
        />
      );
    }
    renderWithProviders(<Harness />);
    fireEvent.change(inputOf('money-bigint'), { target: { value: '12.34' } });
    // 12.34 pesos → 1234 centavos → 1234n
    expect(onValueChange).toHaveBeenCalledWith(1234n);
  });

  it('emits null via onValueChange while the user is in an empty / invalid intermediate state', () => {
    const onValueChange = vi.fn();
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return (
        <MoneyField value={v} onChange={setV} onValueChange={onValueChange} testID="money-null" />
      );
    }
    renderWithProviders(<Harness />);
    fireEvent.change(inputOf('money-null'), { target: { value: '.' } });
    expect(onValueChange).toHaveBeenCalledWith(null);
  });

  it('renders the decimal keyboard variant on the underlying field', () => {
    renderWithProviders(<MoneyField value="" onChange={() => undefined} testID="money-kb" />);
    expect(inputOf('money-kb').getAttribute('data-input-type')).toBe('decimal');
    expect(inputOf('money-kb').getAttribute('inputmode')).toBe('decimal');
  });

  // -- Audit Round 2 G3: edge-case coverage ----------------------------------

  it('accepts a 9 quadrillion-centavo value (Number.MAX_SAFE_INTEGER) without overflow', () => {
    // 9_007_199_254_740_991 centavos = 90_071_992_547_409.91 pesos.
    // Money is a `bigint`, so this never overflows — the test guards
    // against future regressions if anyone "optimises" the parser to
    // use Number.
    const onValueChange = vi.fn();
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return (
        <MoneyField
          label="Monto"
          value={v}
          onChange={setV}
          onValueChange={onValueChange}
          testID="money-max-safe"
        />
      );
    }
    renderWithProviders(<Harness />);
    fireEvent.change(inputOf('money-max-safe'), {
      target: { value: '90071992547409.91' },
    });
    // Centavos as bigint — exact, no precision loss.
    expect(onValueChange).toHaveBeenCalledWith(9_007_199_254_740_991n);
  });

  it('rejects negative values at the input layer (refunds are a separate flow)', () => {
    // CLAUDE.md §1: refunds / devoluciones live in a future flow; the
    // venta / egreso forms should never accept a negative monto.
    const onValueChange = vi.fn();
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return (
        <MoneyField
          value={v}
          onChange={setV}
          onValueChange={onValueChange}
          testID="money-negative"
        />
      );
    }
    renderWithProviders(<Harness />);
    fireEvent.change(inputOf('money-negative'), { target: { value: '-50.00' } });
    // Leading minus is stripped by `clean(...)` — only digits + the
    // first decimal mark survive.
    expect(inputOf('money-negative').value).toBe('50.00');
    // The parsed Money value is positive 5000n centavos — never < 0.
    expect(onValueChange).toHaveBeenCalledWith(5000n);
  });

  it('accepts an en-US locale-typed amount (`1,234.56`) by stripping the thousands separator', () => {
    // Some users paste from spreadsheets with comma grouping. The
    // EU-style `1.234,56` (dot grouping, comma decimal) is NOT
    // supported — see `clean()` JSDoc — and the comma gets dropped,
    // leaving the dotted form. That trade-off is documented and
    // intentional; this test exercises the en-US happy path.
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return <MoneyField value={v} onChange={setV} testID="money-locale" />;
    }
    renderWithProviders(<Harness />);
    const input = inputOf('money-locale');
    fireEvent.change(input, { target: { value: '1,234.56' } });
    expect(input.value).toBe('1,234.56');
  });

  it('preserves trailing zeros (`100.00`) on blur instead of auto-stripping them', () => {
    // formatPesos(`10000n`) returns "100.00" — the formatter pads to
    // two decimals always. Without this guarantee, peso amounts in the
    // UI would oscillate between "100" and "100.00" depending on
    // whether the field had been blurred — confusing for users.
    function Harness(): JSX.Element {
      const [v, setV] = useState('');
      return <MoneyField value={v} onChange={setV} testID="money-trailing" />;
    }
    renderWithProviders(<Harness />);
    const input = inputOf('money-trailing');
    fireEvent.change(input, { target: { value: '100.00' } });
    fireEvent.blur(input);
    expect(input.value).toBe('100.00');
  });
});
