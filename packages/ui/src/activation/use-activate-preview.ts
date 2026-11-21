/**
 * useActivatePreview — «¿Es tu negocio?» (N-25, SEC-MOB-04): asks
 * `/activate/preview` which business a scanned token names, without
 * consuming it, and hands the confirm sheet what to show. Its refusals are
 * the redeem's own, mapped to the same activation error copy; a release
 * build that could never link does not ask (F-15d), like `useActivate`.
 */

import { useMutation } from '@tanstack/react-query';
import type { ActivatePreviewResponse } from '@xangarro/contracts';
import type { VistaPrevia } from '../screens/Activation/vincular-leido';
import { useActivationContext } from './activation-context';
import { activationErrorKey } from './activation-errors';
import { ActivationError, asActivationError, refuseUnusableConfig } from './use-activate';

interface EstadoPrevia {
  readonly data?: ActivatePreviewResponse;
  readonly error: ActivationError | null;
}

/** The mutation's state as the sheet reads it: waiting until it has an answer. */
export function vistaPreviaDe(m: EstadoPrevia): VistaPrevia {
  if (m.error) return { estado: 'error', errorKey: m.error.key };
  if (m.data) return { estado: 'listo', negocio: m.data };
  return { estado: 'cargando' };
}

export function useActivatePreview() {
  const { client, config } = useActivationContext();
  const mutation = useMutation<ActivatePreviewResponse, ActivationError, string>({
    async mutationFn(qrToken) {
      try {
        refuseUnusableConfig(config);
        const res = await client.activatePreview({ qrToken });
        if (!res.ok) throw new ActivationError(activationErrorKey(res.code), res.message);
        return res.data;
      } catch (error: unknown) {
        throw asActivationError(error);
      }
    },
  });
  return {
    vista: vistaPreviaDe(mutation),
    leer: (qrToken: string) => mutation.mutate(qrToken),
    soltar: () => mutation.reset(),
  };
}
