/**
 * What the customer can do with one row of the Facturas list (N-33, P-10):
 * download its PDF/XML, or ask for a nominative CFDI for a payment that went
 * to the monthly "público en general" one. Roles are the portal's business;
 * these decide only what the payment and the fiscal data allow.
 */

import { formatMoney } from '@xangarro/domain';

import type { InboxItemRequest, SupportInbox } from '../support-inbox/index.js';
import type { CfdiMode } from './cfdi-mode.js';
import {
  facturaDelNegocio,
  FacturaError,
  type Factura,
  type FacturaFormato,
  type FacturasSource,
} from './facturas-del-negocio.js';
import { validateTenantFiscal } from './fiscal-validation.js';
import type { PacProvider } from './pac-provider.js';
import type { TenantFiscalData } from './types.js';

export interface FacturaAccionesDeps {
  readonly source: FacturasSource;
  readonly mode: CfdiMode;
}

export interface DocumentoFactura {
  readonly filename: string;
  readonly contentType: 'application/pdf' | 'application/xml';
  readonly bytes: Uint8Array;
}

export interface DescargarFacturaDeps extends FacturaAccionesDeps {
  /** The PAC's document id of a stamped payment of this business; null if none. */
  readonly providerIdOf: (paymentId: string, businessId: string) => Promise<string | null>;
  /** Built only when needed: `off` has no PAC. */
  readonly pac: () => PacProvider;
}

const noDisponible = () =>
  new FacturaError('NO_DISPONIBLE', 'Esta factura no tiene PDF ni XML para descargar aquí.');

/** The PDF or XML of a stamped payment, from the PAC. Never with `CFDI_MODE=off`. */
export async function descargarFactura(
  deps: DescargarFacturaDeps,
  input: { readonly businessId: string; readonly paymentId: string; readonly formato: unknown },
): Promise<DocumentoFactura> {
  const formato = input.formato;
  if (formato !== 'pdf' && formato !== 'xml') {
    throw new FacturaError('DATO_INVALIDO', 'El formato debe ser pdf o xml.');
  }
  if (deps.mode === 'off') throw noDisponible();
  const factura = await facturaDelNegocio(deps, input.businessId, input.paymentId);
  if (!(formato === 'pdf' ? factura.pdfDisponible : factura.xmlDisponible)) throw noDisponible();
  const providerId = await deps.providerIdOf(input.paymentId, input.businessId);
  if (providerId === null) throw noDisponible();
  const pac = deps.pac();
  const bytes = formato === 'pdf' ? await pac.getPdf(providerId) : await pac.getXml(providerId);
  return documento(factura, formato, bytes);
}

function documento(factura: Factura, formato: FacturaFormato, bytes: Uint8Array): DocumentoFactura {
  const name = (factura.cfdiUuid ?? factura.paymentId).replace(/[^A-Za-z0-9_-]/g, '');
  return {
    filename: `factura-xangarro-${name}.${formato}`,
    contentType: formato === 'pdf' ? 'application/pdf' : 'application/xml',
    bytes,
  };
}

export interface SolicitarNominalDeps extends FacturaAccionesDeps {
  readonly inbox: SupportInbox;
}

/** The inbox item staff act on; idempotent per payment (`sourceRef`). */
export function solicitudNominalItem(businessId: string, factura: Factura): InboxItemRequest {
  return {
    kind: 'factura',
    urgent: false,
    businessId,
    title: `Solicitud de factura nominal · ${formatMoney(factura.totalCentavos)}`,
    body: [
      `Pago: ${factura.paymentId}`,
      `Total: ${formatMoney(factura.totalCentavos)} MXN (IVA incluido)`,
      `Pagado: ${factura.paidAt}`,
      'El cliente ya tiene datos fiscales válidos y pide su CFDI nominal en lugar del global.',
    ].join('\n'),
    source: 'portal-factura',
    sourceRef: `nominal:${factura.paymentId}`,
    paymentRef: factura.paymentId,
  };
}

/**
 * «Solicitar factura»: only for a payment in the global CFDI, and only when
 * the business's fiscal data validates; files one inbox item per payment.
 */
export async function solicitarFacturaNominal(
  deps: SolicitarNominalDeps,
  input: {
    readonly businessId: string;
    readonly paymentId: string;
    readonly fiscal: TenantFiscalData | null;
  },
): Promise<void> {
  const factura = await facturaDelNegocio(deps, input.businessId, input.paymentId);
  if (!factura.puedeSolicitarNominal) {
    throw new FacturaError('NO_APLICA', 'Este pago no está en la factura global.');
  }
  if (!validateTenantFiscal(input.fiscal ?? {}).ok) {
    throw new FacturaError(
      'DATOS_FISCALES_INCOMPLETOS',
      'Completa los datos fiscales de tu negocio para pedir tu factura.',
    );
  }
  await deps.inbox.file(solicitudNominalItem(input.businessId, factura));
}
