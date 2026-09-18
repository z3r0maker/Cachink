import type { TenantFiscalSource } from '@xangarro/application/cfdi';
import { tenantFiscalOf, type Db, type TenantFiscalRow } from '@xangarro/data-pg';

/**
 * `TenantFiscalSource` over `xangarro.tenant_fiscal()` (N-33, 0014), on the
 * `xangarro_billing` connection. The régimen is the SAT code (`regimen_sat`,
 * ADR-082); the email is the business owner's account address.
 *
 * A missing business reads as null — the payment joins the global CFDI. A
 * database failure is thrown, so the webhook answers 500 and Stripe retries.
 */
export type TenantFiscalQuery = (businessId: string) => Promise<TenantFiscalRow | null>;

export function tenantFiscalSource(query: TenantFiscalQuery): TenantFiscalSource {
  return { fiscalOf: (tenantId) => query(tenantId) };
}

export function pgTenantFiscalSource(db: Db): TenantFiscalSource {
  return tenantFiscalSource((businessId) => tenantFiscalOf(db, businessId));
}
