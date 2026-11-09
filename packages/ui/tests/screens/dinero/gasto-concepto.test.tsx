/**
 * The gasto sheet's text fields must never autocorrect: a product or a
 * supplier's name is data, and iOS replaced typed text mid-word («Gas»
 * became «Gaslighting», M-11). The prop, not the wording, is the contract.
 */
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '../../test-utils';
import { Concepto, Proveedor } from '../../../src/screens/Gastos/gasto-campos';

const f = {
  concepto: '',
  setConcepto: () => undefined,
  quien: '',
  setQuien: () => undefined,
} as never;

describe('gasto fields', () => {
  it.each([
    ['gasto-concepto', Concepto],
    ['gasto-proveedor', Proveedor],
  ] as const)('%s turns autocorrect off', (testID, Field) => {
    renderWithProviders(<Field f={f} />);
    // react-native-web maps autoCorrect={false} to autocorrect="off" on the DOM input.
    expect(screen.getByTestId(testID).getAttribute('autocorrect')).toBe('off');
  });
});
