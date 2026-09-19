import 'server-only';

import {
  CrearClienteUseCase,
  CrearProductoUseCase,
  EditarClienteUseCase,
  EditarProductoUseCase,
} from '@xangarro/application';
import type { BusinessId, ClientId, ProductId } from '@xangarro/domain';

import type { PlannedRow as PlannedProductRow } from '@/lib/import-plan';
import type { PlannedClientRow } from '@/lib/import-plan-clientes';

import type { Tx } from '../db';
import { pgClientsRepository } from '../repositories/clients';
import { pgProductsRepository } from '../repositories/products';
import { planFromFile as planProductsFromFile } from './plan-productos';
import { planClientsFromFile } from './plan-clientes';

/**
 * The import template registry (N-16): one entry per sheet a business can
 * upload. Each entry knows how to turn a file into a plan (dry-run preview
 * and commit share it), how to render that plan as preview rows, and how to
 * apply it through the same use cases the interactive forms use — so no
 * import row ever bypasses a business rule.
 */
export type TemplateId = 'productos' | 'clientes';

export interface PreviewRow {
  readonly line: number;
  readonly kind: 'nuevo' | 'actualizar' | 'sin-cambios' | 'error';
  readonly sku: string;
  readonly nombre: string;
  readonly errors: readonly string[];
}

export type PlanCounts = Record<PreviewRow['kind'], number> & { total: number };

export interface ImportTemplate {
  readonly id: TemplateId;
  /** Navigation and copy: what the screen calls the things being imported. */
  readonly label: string;
  readonly entidad: string;
  /** The template-download route for this sheet. */
  readonly templateHref: string;
  readonly accept: string;
  plan(tx: Tx, file: File): Promise<readonly PlannedProductRow[] | readonly PlannedClientRow[]>;
  preview(plan: readonly PlannedProductRow[] | readonly PlannedClientRow[]): readonly PreviewRow[];
  apply(tx: Tx, businessId: BusinessId, plan: readonly unknown[]): Promise<void>;
}

const kindOf = (r: { kind: string }): PreviewRow['kind'] => r.kind as PreviewRow['kind'];

const productos: ImportTemplate = {
  id: 'productos',
  label: 'Productos',
  entidad: 'productos',
  templateHref: '/api/import/productos',
  accept: '.xlsx,.csv',
  plan: (tx, file) => planProductsFromFile(tx, file),
  preview: (plan) =>
    (plan as readonly PlannedProductRow[]).map((p) => ({
      line: p.line,
      kind: kindOf(p),
      sku: p.values?.sku ?? '',
      nombre: p.values?.nombre ?? '',
      errors: p.errors,
    })),
  apply: async (tx, businessId, plan) => {
    const repo = pgProductsRepository(tx, businessId);
    for (const row of plan as readonly PlannedProductRow[]) {
      if (row.values === null) continue;
      const { seguirStock: _s, costoUnitCentavos: _c, ...patch } = row.values;
      if (row.kind === 'actualizar' && row.id !== undefined) {
        await new EditarProductoUseCase(repo).execute({ id: row.id as ProductId, patch });
      } else if (row.kind === 'nuevo') {
        await new CrearProductoUseCase(repo).execute({ product: { ...row.values, businessId } });
      }
    }
  },
};

const clientes: ImportTemplate = {
  id: 'clientes',
  label: 'Clientes',
  entidad: 'clientes',
  templateHref: '/api/import/clientes',
  accept: '.xlsx,.csv',
  plan: (tx, file) => planClientsFromFile(tx, file),
  preview: (plan) =>
    (plan as readonly PlannedClientRow[]).map((p) => ({
      line: p.line,
      kind: kindOf(p),
      sku: '',
      nombre: p.values?.nombre ?? '',
      errors: p.errors,
    })),
  apply: async (tx, businessId, plan) => {
    const repo = pgClientsRepository(tx, businessId);
    for (const row of plan as readonly PlannedClientRow[]) {
      if (row.values === null) continue;
      if (row.kind === 'actualizar' && row.id !== undefined) {
        await new EditarClienteUseCase(repo).execute({
          id: row.id as ClientId,
          patch: row.patch ?? {},
        });
      } else if (row.kind === 'nuevo') {
        await new CrearClienteUseCase(repo).execute({
          client: {
            nombre: row.values.nombre,
            telefono: row.values.telefono ?? undefined,
            rfc: row.values.rfc ?? undefined,
            businessId,
          },
        });
      }
    }
  },
};

export const TEMPLATES: Readonly<Record<TemplateId, ImportTemplate>> = { productos, clientes };

/**
 * The template a form asked for; a form with no `plantilla` field (or an
 * unknown one) is Productos — P-07's callers send exactly that, and their
 * behaviour is unchanged by the registry.
 */
export function templateOf(form: FormData): ImportTemplate {
  const asked = form.get('plantilla');
  const t = TEMPLATES[asked as TemplateId];
  return t === undefined ? TEMPLATES.productos : t;
}
