/**
 * EntregasCreditoRepository — grouped credit delivery CRUD. Phase 11.
 */
import type { EntregaCredito } from '@cachink/domain';
import type { BusinessId, ClientId, EntregaCreditoId } from '@cachink/domain';

export type { EntregaCredito };

export interface CreateEntregaCreditoInput {
  readonly clienteId: ClientId;
  readonly fecha: string;
  readonly totalCentavos: bigint;
  readonly nota: string | null;
  readonly saleIds: string;
  readonly businessId: BusinessId;
}

export interface EntregasCreditoRepository {
  create(input: CreateEntregaCreditoInput): Promise<EntregaCredito>;
  findById(id: EntregaCreditoId): Promise<EntregaCredito | null>;
  findByClient(clientId: ClientId): Promise<readonly EntregaCredito[]>;
  findByBusiness(businessId: BusinessId): Promise<readonly EntregaCredito[]>;
}
