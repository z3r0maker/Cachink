/**
 * AuditoriasInventarioRepository — physical inventory count CRUD. Phase 10.
 */
import type { AuditoriaInventario } from '@cachink/domain';
import type { AuditoriaInventarioId, BusinessId } from '@cachink/domain';

export type { AuditoriaInventario };

export interface CreateAuditoriaInput {
  readonly fecha: string;
  readonly lineas: string;
  readonly totalProductos: number;
  readonly businessId: BusinessId;
}

export type AuditoriaPatch = Partial<Pick<AuditoriaInventario,
  'estado' | 'lineas' | 'totalDiscrepancias' | 'productosContados'
>>;

export interface AuditoriasInventarioRepository {
  create(input: CreateAuditoriaInput): Promise<AuditoriaInventario>;
  findById(id: AuditoriaInventarioId): Promise<AuditoriaInventario | null>;
  findLatest(businessId: BusinessId): Promise<AuditoriaInventario | null>;
  findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly AuditoriaInventario[]>;
  update(id: AuditoriaInventarioId, patch: AuditoriaPatch): Promise<AuditoriaInventario>;
}
