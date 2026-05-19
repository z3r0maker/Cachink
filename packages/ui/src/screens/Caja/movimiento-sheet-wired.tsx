/**
 * MovimientoSheetWired — wires CajaMovimientoSheet to the repository.
 *
 * Extracted from caja-content.tsx to respect 200-line budget.
 */

import { useState, type ReactElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BusinessId, CajaMovimientoTipo, CajaTurnoId, Money, UserId } from '@cachink/domain';
import { CajaMovimientoSheet } from './caja-movimiento-sheet';
import { useCajaMovimientosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { cajaKeys } from '../../hooks/query-keys';

export interface MovimientoSheetWiredProps {
  readonly tipo: CajaMovimientoTipo;
  readonly turnoId: string;
  readonly userId: string;
  readonly onClose: () => void;
}

export function MovimientoSheetWired(props: MovimientoSheetWiredProps): ReactElement {
  const businessId = useCurrentBusinessId() as BusinessId;
  const movRepo = useCajaMovimientosRepository();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  return (
    <CajaMovimientoSheet
      open
      tipo={props.tipo}
      onClose={props.onClose}
      submitting={submitting}
      onSubmit={async (montoCentavos: Money, motivo: string) => {
        setSubmitting(true);
        try {
          await movRepo.create({
            turnoId: props.turnoId as CajaTurnoId,
            tipo: props.tipo,
            montoCentavos,
            motivo,
            userId: props.userId as UserId,
            businessId,
          });
          // Refresh the active turn balance display (fire-and-forget for snappy UX)
          void queryClient.invalidateQueries({ queryKey: cajaKeys.openByUser(businessId) });
          void queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId) });
          props.onClose();
        } finally {
          setSubmitting(false);
        }
      }}
    />
  );
}
