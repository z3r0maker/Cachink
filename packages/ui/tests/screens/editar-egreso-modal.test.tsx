/**
 * EditarEgresoModal — prefill, typing and per-payment reset. The form state
 * lives below the Modal (see the component header for the dropped-keystroke
 * finding on the iPad sim).
 */

import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';
import { makeExpense } from '@xangarro/testing';
import { MockRepositoryProvider } from '@xangarro/testing/ui';
import { EditarEgresoModal } from '../../src/screens/Egresos/editar-egreso-modal';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function Wrapper({ children }: { children: ReactNode }): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <MockRepositoryProvider>{children}</MockRepositoryProvider>
    </QueryClientProvider>
  );
}

function conceptoInput(): HTMLInputElement {
  const field = screen.getAllByTestId('editar-egreso-concepto')[0]!;
  return (field.tagName === 'INPUT' ? field : field.querySelector('input'))! as HTMLInputElement;
}

describe('EditarEgresoModal', () => {
  it('prefills the concepto of the payment being edited', () => {
    const renta = makeExpense({ concepto: 'Renta del local' });
    renderWithProviders(
      <Wrapper>
        <EditarEgresoModal open onClose={() => {}} editing={renta} />
      </Wrapper>,
    );
    expect(conceptoInput().value).toBe('Renta del local');
  });

  it('keeps what the user types', () => {
    const renta = makeExpense({ concepto: 'Renta del local' });
    renderWithProviders(
      <Wrapper>
        <EditarEgresoModal open onClose={() => {}} editing={renta} />
      </Wrapper>,
    );
    fireEvent.change(conceptoInput(), { target: { value: 'Editado' } });
    expect(conceptoInput().value).toBe('Editado');
  });

  it('starts from the new payment when a different one is opened', () => {
    const renta = makeExpense({ concepto: 'Renta del local' });
    const luz = makeExpense({ concepto: 'Luz del local' });
    const { rerender } = renderWithProviders(
      <Wrapper>
        <EditarEgresoModal open onClose={() => {}} editing={renta} />
      </Wrapper>,
    );
    fireEvent.change(conceptoInput(), { target: { value: 'Borrador' } });
    rerender(
      <Wrapper>
        <EditarEgresoModal open onClose={() => {}} editing={luz} />
      </Wrapper>,
    );
    expect(conceptoInput().value).toBe('Luz del local');
  });

  it('renders no form while nothing is being edited', () => {
    renderWithProviders(
      <Wrapper>
        <EditarEgresoModal open onClose={() => {}} editing={null} />
      </Wrapper>,
    );
    expect(screen.queryByTestId('editar-egreso-concepto')).toBeNull();
  });
});
