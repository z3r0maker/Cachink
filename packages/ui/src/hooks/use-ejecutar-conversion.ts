/**
 * useEjecutarConversion — mutation wrapping EjecutarConversionUseCase.
 * Phase 18.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, ConversionRecetaId, IsoDate } from '@cachink/domain';
import {
  EjecutarConversionUseCase,
  type EjecutarConversionResult,
} from '@cachink/application';
import {
  useConversionRecetasRepository,
  useConversionsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_EJECUTAR_CONVERSION } from '../observability/audit-configs';

export interface EjecutarConversionMutationInput {
  readonly recetaId: ConversionRecetaId;
  readonly multiplicador: number;
  readonly today?: IsoDate;
}

export function useEjecutarConversion(): UseMutationResult<
  EjecutarConversionResult,
  Error,
  EjecutarConversionMutationInput
> {
  const recetas = useConversionRecetasRepository();
  const conversions = useConversionsRepository();
  const movements = useInventoryMovementsRepository();
  const products = useProductsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const emitAlert = useEmitDirectorAlert();

  const rawUseCase = useMemo(
    () => new EjecutarConversionUseCase(recetas, conversions, movements, products),
    [recetas, conversions, movements, products],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_EJECUTAR_CONVERSION);

  return useMutation<EjecutarConversionResult, Error, EjecutarConversionMutationInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('No current business');
      return useCase.execute({
        ...input,
        businessId: businessId as BusinessId,
      });
    },
    async onSuccess(result) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversiones', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
      ]);

      // Alert: conversion-automatica
      emitAlert.mutate({
        source: 'conversion-automatica',
        severity: 'info',
        titleKey: 'notificaciones.conversionAutomatica',
        message: `Conversión completada exitosamente.`,
        actionRoute: '/conversion',
        metadata: JSON.stringify({ conversionId: result.conversion.id }),
      });

      // Alert: conversion-costo — check if conversion cost exceeds product price
      if (businessId) {
        const receta = await recetas.findById(result.conversion.recetaId);
        if (receta) {
          const prod = await products.findById(receta.productoResultanteId);
          const mp = await products.findById(receta.materiaPrimaId);
          if (prod && mp && mp.costoUnitCentavos > prod.precioVentaCentavos) {
            emitAlert.mutate({
              source: 'conversion-costo',
              severity: 'warning',
              titleKey: 'notificaciones.conversionCosto',
              message: 'El costo de materia prima supera el precio de venta del producto.',
              actionRoute: '/conversion',
              metadata: JSON.stringify({ conversionId: result.conversion.id }),
            });
          }
        }
      }
    },
  });
}
