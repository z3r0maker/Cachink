/**
 * ConversionRecetasRepository — recipe CRUD for materia prima conversion.
 * Phase 8.
 */
import type { ConversionReceta } from '@cachink/domain';
import type { BusinessId, ConversionRecetaId, ProductId } from '@cachink/domain';

export type { ConversionReceta };

export interface CreateConversionRecetaInput {
  readonly materiaPrimaId: ProductId;
  readonly productoResultanteId: ProductId;
  readonly cantidadOrigen: number;
  readonly cantidadResultante: number;
  readonly businessId: BusinessId;
}

export interface ConversionRecetasRepository {
  create(input: CreateConversionRecetaInput): Promise<ConversionReceta>;
  findById(id: ConversionRecetaId): Promise<ConversionReceta | null>;
  findByMateriaPrima(mpId: ProductId): Promise<readonly ConversionReceta[]>;
  findByProductoResultante(prodId: ProductId): Promise<ConversionReceta | null>;
  findAllByBusiness(businessId: BusinessId): Promise<readonly ConversionReceta[]>;
  delete(id: ConversionRecetaId): Promise<void>;
}
