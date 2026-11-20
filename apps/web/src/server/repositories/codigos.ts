import 'server-only';

import type { CodigosDeProducto } from '@xangarro/application';
import { findProductosPorCodigo } from '@xangarro/data-pg';

import type { Tx } from '../db';

/**
 * Who has a barcode (P-44, ADR-150), bound to one tenant transaction: the port
 * `CrearProductoUseCase` and `EditarProductoUseCase` refuse a duplicate
 * through. RLS scopes the read to the business.
 */
export function pgCodigos(tx: Tx): CodigosDeProducto {
  return { conCodigo: (clave) => findProductosPorCodigo(tx, clave) };
}
