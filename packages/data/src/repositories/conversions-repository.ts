/**
 * ConversionsRepository — executed conversion records. Phase 8.
 */
import type { Conversion } from '@xangarro/domain';
import type { BusinessId, ConversionId, ConversionRecetaId } from '@xangarro/domain';

export type { Conversion };

export interface CreateConversionInput {
  readonly recetaId: ConversionRecetaId;
  readonly materiaPrimaId: string;
  readonly productoResultanteId: string;
  readonly cantidadOrigenUsada: number;
  readonly cantidadResultanteCreada: number;
  readonly movimientoSalidaId: string;
  readonly movimientoEntradaId: string;
  readonly businessId: BusinessId;
}

export interface ConversionsRepository {
  create(input: CreateConversionInput): Promise<Conversion>;
  findById(id: ConversionId): Promise<Conversion | null>;
  findByBusiness(businessId: BusinessId): Promise<readonly Conversion[]>;
}
