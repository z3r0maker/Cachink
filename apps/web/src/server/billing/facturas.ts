'use server';

import { readCfdiMode } from '@xangarro/application/cfdi';
import { cfdiPaymentOf, facturasDelNegocioRows, getBusiness } from '@xangarro/data-pg';

import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { supportInboxFromEnv } from '../support-inbox';
import { livePacProvider } from './cfdi';
import { billingDb } from './config';
import {
  listarFacturasCon,
  solicitarFacturaNominalCon,
  urlDescargaFacturaCon,
  type DescargaFacturaResult,
  type FacturasPorts,
  type ListarFacturasResult,
  type SolicitudFacturaResult,
} from './facturas-core';

/**
 * The Facturas server functions the Suscripción screen (P-10) calls (N-33).
 * No screen is edited here. The business comes from the signed session, never
 * from the caller; the list is read as the tenant through
 * `xangarro.facturas_del_negocio()` (0019), which returns nothing for any
 * other business. Result shapes and codes: `./facturas-core.ts`.
 */
const ports: FacturasPorts = {
  member: async (minRole) => {
    const session = await requireMember(minRole);
    return { businessId: session.business_id, email: session.email };
  },
  mode: () => readCfdiMode(process.env),
  source: (businessId) => withTenant(businessId, (tx) => facturasDelNegocioRows(tx, businessId)),
  providerIdOf: async (paymentId, businessId) => {
    const row = await cfdiPaymentOf(billingDb(), paymentId);
    return row?.businessId === businessId ? row.invoiceProviderId : null;
  },
  pac: () => livePacProvider(),
  fiscalOf: (businessId, email) =>
    withTenant(businessId, async (tx) => {
      const b = await getBusiness(tx);
      if (!b) return null;
      const { rfc, razonSocial, regimenSat, usoCfdi, codigoPostal } = b;
      return { rfc, razonSocial, regimenFiscal: regimenSat, usoCfdi, codigoPostal, email };
    }),
  inbox: () => supportInboxFromEnv(),
  report: reportError,
};

/** The business's subscription payments and their CFDI state, newest first. Any member. */
export async function listarFacturas(): Promise<ListarFacturasResult> {
  return listarFacturasCon(ports);
}

/** A `data:` URL of the PDF or XML. Owner/admin; `NO_DISPONIBLE` with `CFDI_MODE=off`. */
export async function urlDescargaFactura(
  paymentId: string,
  formato: 'pdf' | 'xml',
): Promise<DescargaFacturaResult> {
  return urlDescargaFacturaCon(ports, paymentId, formato);
}

/** Ask staff for a nominative CFDI for a payment in the global one. Owner only. */
export async function solicitarFacturaNominal(paymentId: string): Promise<SolicitudFacturaResult> {
  return solicitarFacturaNominalCon(ports, paymentId);
}
