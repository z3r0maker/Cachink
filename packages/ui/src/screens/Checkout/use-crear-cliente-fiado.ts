/**
 * «Cliente nuevo» at the caja (MvFiado): the client is created through
 * `CrearClienteUseCase` marked `pendiente` (ADR-074), so the owner reviews
 * it in the portal, and the fiado goes on to their account at once.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CrearClienteUseCase } from '@xangarro/application';
import type { BusinessId, Client } from '@xangarro/domain';
import { useClientsRepository } from '../../app/index';
import { useCurrentBusinessId } from '../../app-config/index';
import { cobrarKeys } from './use-cobrar-datos';

/** Seven digits at least, as the domain asks; a shorter number is left out. */
export const telefonoValido = (tel: string): boolean => tel.replace(/\D/g, '').length >= 7;

export function useCrearClienteFiado() {
  const clients = useClientsRepository();
  const businessId = useCurrentBusinessId();
  const queryClient = useQueryClient();
  return useMutation<Client, Error, { nombre: string; telefono: string }>({
    async mutationFn({ nombre, telefono }) {
      if (!businessId) throw new Error('No hay negocio en esta caja');
      return new CrearClienteUseCase(clients).execute({
        client: {
          nombre,
          telefono: telefonoValido(telefono) ? telefono.trim() : undefined,
          estadoRevision: 'pendiente',
          businessId: businessId as BusinessId,
        },
      });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: cobrarKeys.clientes(businessId) });
    },
  });
}
