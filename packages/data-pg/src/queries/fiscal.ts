/**
 * A business's fiscal data for the CFDI of its subscription payments (N-33).
 *
 * Run on the `xangarro_billing` connection: `xangarro.tenant_fiscal()` (0014)
 * is the only way that role reads a business, and it returns the receptor
 * fields and nothing else. `regimenFiscal` is the SAT code (`regimen_sat`,
 * ADR-082), never the derived bucket; `email` is the owner's account address.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '../client.js';

type Conn = Db | Parameters<Parameters<Db['transaction']>[0]>[0];

/** The receptor fields as the business stored them; any may be null. */
export interface TenantFiscalRow {
  readonly rfc: string | null;
  readonly razonSocial: string | null;
  /** SAT c_RegimenFiscal code, e.g. '626'. */
  readonly regimenFiscal: string | null;
  readonly usoCfdi: string | null;
  readonly codigoPostal: string | null;
  readonly email: string | null;
}

interface Raw extends Record<string, unknown> {
  rfc: string | null;
  razon_social: string | null;
  regimen_sat: string | null;
  uso_cfdi: string | null;
  codigo_postal: string | null;
  email: string | null;
}

/** Null when no live business has that id. */
export async function tenantFiscalOf(
  db: Conn,
  businessId: string,
): Promise<TenantFiscalRow | null> {
  const rows = await db.execute<Raw>(sql`SELECT * FROM xangarro.tenant_fiscal(${businessId})`);
  const r = rows[0];
  if (r === undefined) return null;
  return {
    rfc: r.rfc,
    razonSocial: r.razon_social,
    regimenFiscal: r.regimen_sat,
    usoCfdi: r.uso_cfdi,
    codigoPostal: r.codigo_postal,
    email: r.email,
  };
}
