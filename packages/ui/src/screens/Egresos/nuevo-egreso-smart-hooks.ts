/**
 * Mutation glue for `<NuevoEgresoModalSmart>`. Split out of the main
 * component file so each stays under the 200-line budget
 * (CLAUDE.md §4.4).
 *
 * Each hook wires one tab's `onSubmit` to the right use-case
 * hook(s) and returns a handler + `submitting` flag. The tab
 * components themselves are untouched — they still accept
 * plain-data callbacks and know nothing about TanStack or
 * repositories.
 */

import { useCallback } from 'react';
import type { NewExpense, NewInventoryMovement } from '@xangarro/domain';
import { useRegistrarEgreso } from '../../hooks/use-registrar-egreso';
import { useCrearGastoRecurrente } from '../../hooks/use-crear-gasto-recurrente';
import { useRegistrarMovimiento } from '../../hooks/use-registrar-movimiento';
import type { GastoSubmitPayload } from './tabs/gasto-tab';

export interface GastoSubmit {
  readonly handle: (payload: GastoSubmitPayload) => void;
  readonly submitting: boolean;
}

export function useGastoSubmit(onClose: () => void): GastoSubmit {
  const registrar = useRegistrarEgreso();
  const crearRecurrente = useCrearGastoRecurrente();
  const handle = useCallback(
    (payload: GastoSubmitPayload) => {
      registrar.mutate(payload.egreso, {
        onSuccess: () => {
          if (payload.recurrente) {
            crearRecurrente.mutate(payload.recurrente, {
              onSuccess: () => onClose(),
              onError: () => onClose(),
            });
            return;
          }
          onClose();
        },
      });
    },
    [registrar, crearRecurrente, onClose],
  );
  return {
    handle,
    submitting: registrar.isPending || crearRecurrente.isPending,
  };
}

export interface NominaSubmit {
  readonly handle: (input: NewExpense) => void;
  readonly submitting: boolean;
}

export function useNominaSubmit(onClose: () => void): NominaSubmit {
  const registrar = useRegistrarEgreso();
  const handle = useCallback(
    (input: NewExpense) => {
      registrar.mutate(input, { onSuccess: () => onClose() });
    },
    [registrar, onClose],
  );
  return {
    handle,
    submitting: registrar.isPending,
  };
}

export interface InventarioSubmit {
  readonly handle: (input: NewInventoryMovement) => void;
  readonly submitting: boolean;
}

export function useInventarioSubmit(onClose: () => void): InventarioSubmit {
  const registrar = useRegistrarMovimiento();
  const handle = useCallback(
    (input: NewInventoryMovement) => {
      registrar.mutate(input, { onSuccess: () => onClose() });
    },
    [registrar, onClose],
  );
  return { handle, submitting: registrar.isPending };
}
