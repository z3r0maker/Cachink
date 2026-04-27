/**
 * CorteDeDiaModal tests (Slice 3 C3).
 */

import { describe, expect, it, vi } from 'vitest';
import { CorteDeDiaModal } from '../../src/screens/index';
import { buildPayload, computeDiferencia, validate } from '../../src/screens/CorteDeDia/corte-form';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('corte-form helpers', () => {
  it('computeDiferencia returns contado - esperado (positive when sobra)', () => {
    expect(computeDiferencia('500.00', 45000n)).toBe(5000n);
  });

  it('computeDiferencia returns 0 when contado equals esperado', () => {
    expect(computeDiferencia('450.00', 45000n)).toBe(0n);
  });

  it('computeDiferencia returns negative when falta', () => {
    expect(computeDiferencia('400.00', 45000n)).toBe(-5000n);
  });

  it('validate rejects empty contado with required label', () => {
    const errors = validate(
      { contadoPesos: '', explicacion: '' },
      0n,
      'Requerido',
      'Explica la diferencia para continuar',
    );
    expect(errors.contado).toBe('Requerido');
  });

  it('validate requires explicacion only when diferencia !== 0', () => {
    const cuadra = validate(
      { contadoPesos: '450.00', explicacion: '' },
      45000n,
      'Requerido',
      'Explica la diferencia para continuar',
    );
    expect(cuadra).toEqual({});

    const falta = validate(
      { contadoPesos: '400.00', explicacion: '' },
      45000n,
      'Requerido',
      'Explica la diferencia para continuar',
    );
    expect(falta.explicacion).toBe('Explica la diferencia para continuar');
  });

  it('buildPayload emits centavos and omits empty explicacion', () => {
    const payload = buildPayload({ contadoPesos: '123.45', explicacion: '  ' });
    expect(payload.efectivoContadoCentavos).toBe(12345n);
    expect(payload.explicacion).toBeUndefined();
  });
});

describe('CorteDeDiaModal', () => {
  it('renders the esperado value when open', () => {
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={vi.fn()} esperado={45000n} />,
    );
    const esperadoRow = screen.getByTestId('corte-esperado-row');
    expect(esperadoRow.textContent).toContain('$450.00');
  });

  it('updates diferencia live as contado input changes', () => {
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={vi.fn()} esperado={45000n} />,
    );
    const input = screen.getByTestId('corte-contado-input').querySelector('input')!;
    fireEvent.change(input, { target: { value: '500.00' } });
    const diferenciaRow = screen.getByTestId('corte-diferencia-row');
    expect(diferenciaRow.textContent).toContain('$50.00');
  });

  it('gates submit when contado is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={onSubmit} esperado={0n} />,
    );
    fireEvent.click(screen.getAllByTestId('corte-submit')[0]!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the payload when contado matches esperado (no explicacion needed)', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={onSubmit} esperado={45000n} />,
    );
    const input = screen.getByTestId('corte-contado-input').querySelector('input')!;
    fireEvent.change(input, { target: { value: '450.00' } });
    fireEvent.click(screen.getAllByTestId('corte-submit')[0]!);
    expect(onSubmit).toHaveBeenCalledWith({
      efectivoContadoCentavos: 45000n,
      explicacion: undefined,
    });
  });

  it('blocks submit and shows explicacion error when diferencia exists but no explicacion', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={onSubmit} esperado={45000n} />,
    );
    const input = screen.getByTestId('corte-contado-input').querySelector('input')!;
    fireEvent.change(input, { target: { value: '400.00' } });
    fireEvent.click(screen.getAllByTestId('corte-submit')[0]!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with explicacion when diferencia is non-zero and explicacion provided', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <CorteDeDiaModal open onClose={vi.fn()} onSubmit={onSubmit} esperado={45000n} />,
    );
    const contadoInput = screen.getByTestId('corte-contado-input').querySelector('input')!;
    fireEvent.change(contadoInput, { target: { value: '400.00' } });
    const explicacionInput = screen.getByTestId('corte-explicacion-input').querySelector('input')!;
    fireEvent.change(explicacionInput, { target: { value: 'Propina dada' } });
    fireEvent.click(screen.getAllByTestId('corte-submit')[0]!);
    expect(onSubmit).toHaveBeenCalledWith({
      efectivoContadoCentavos: 40000n,
      explicacion: 'Propina dada',
    });
  });
});
