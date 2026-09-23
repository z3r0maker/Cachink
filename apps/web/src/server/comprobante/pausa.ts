import 'server-only';

import { tenantEntitlementInputs } from '../billing/plan';
import type { Tx } from '../db';

/**
 * The `comprobanteShare` kill switch (N-09), checked where every server-made
 * comprobante is rendered: the owner's «Compartir comprobante» and the
 * register's server image. Staff flip it in the console's /flags; it applies
 * on the next request. The register's local-canvas fallback and the phone do
 * not see it yet — carrying kill switches to devices is a contract change
 * (C-21).
 */
export const COMPROBANTES_PAUSADOS = 'El envío de comprobantes está en pausa. Intenta más tarde.';

export async function comprobantesPausados(tx: Tx, businessId: string): Promise<boolean> {
  return !(await tenantEntitlementInputs(tx, businessId)).platform.comprobanteShare;
}
