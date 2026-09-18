import {
  descargarFactura,
  facturasDelNegocio,
  FacturaError,
  solicitarFacturaNominal,
  type CfdiMode,
  type Factura,
  type FacturaErrorCode,
  type FacturasSource,
  type PacProvider,
  type TenantFiscalData,
} from '@xangarro/application/cfdi';
import type { SupportInbox } from '@xangarro/application/support-inbox';

import type { Role } from '@/session/types';
import type { ReportScope } from '../observability/report';

/**
 * The Facturas server functions' logic (N-33, P-10), over injected ports so it
 * is testable without cookies or a database; `./facturas.ts` wires the real
 * ones. Every function answers a result — never throws at the screen: a typed
 * refusal carries its code and a message to show; anything else is reported
 * and answers `FALLO`.
 */
export type FacturaActionCode = FacturaErrorCode | 'NO_PERMITIDO' | 'FALLO';
export type FacturaFallo = { ok: false; code: FacturaActionCode; message: string };

export type ListarFacturasResult = { ok: true; facturas: Factura[] } | FacturaFallo;
/** `url` is a `data:` URL of the document, ready for `<a href download={filename}>`. */
export type DescargaFacturaResult = { ok: true; url: string; filename: string } | FacturaFallo;
export type SolicitudFacturaResult = { ok: true } | FacturaFallo;

export interface FacturasPorts {
  /** The signed session's business, if the member clears `minRole`; throws NOT_PERMITTED. */
  readonly member: (
    minRole: Role,
  ) => Promise<{ readonly businessId: string; readonly email: string }>;
  readonly mode: () => CfdiMode;
  readonly source: FacturasSource;
  readonly providerIdOf: (paymentId: string, businessId: string) => Promise<string | null>;
  readonly pac: () => PacProvider;
  /** The business's own fiscal data, read as the tenant. */
  readonly fiscalOf: (businessId: string, email: string) => Promise<TenantFiscalData | null>;
  readonly inbox: () => SupportInbox;
  readonly report: (error: unknown, scope: ReportScope) => void;
}

const FALLO = 'No pudimos completar la acción. Intenta de nuevo en un momento.';

function fallo(ports: FacturasPorts, error: unknown, endpoint: string): FacturaFallo {
  if (error instanceof FacturaError) return { ok: false, code: error.code, message: error.message };
  if ((error as { code?: unknown } | null)?.code === 'NOT_PERMITTED') {
    return { ok: false, code: 'NO_PERMITIDO', message: (error as Error).message };
  }
  ports.report(error, { endpoint });
  return { ok: false, code: 'FALLO', message: FALLO };
}

/** Any member may look. */
export async function listarFacturasCon(ports: FacturasPorts): Promise<ListarFacturasResult> {
  try {
    const { businessId } = await ports.member('viewer');
    const facturas = await facturasDelNegocio(
      { source: ports.source, mode: ports.mode() },
      businessId,
    );
    return { ok: true, facturas };
  } catch (error) {
    return fallo(ports, error, 'listarFacturas');
  }
}

/** Owner or admin; `test`/`live` only. */
export async function urlDescargaFacturaCon(
  ports: FacturasPorts,
  paymentId: string,
  formato: 'pdf' | 'xml',
): Promise<DescargaFacturaResult> {
  try {
    const { businessId } = await ports.member('admin');
    const doc = await descargarFactura(
      { ...ports, mode: ports.mode() },
      { businessId, paymentId, formato },
    );
    const base64 = Buffer.from(doc.bytes).toString('base64');
    return { ok: true, url: `data:${doc.contentType};base64,${base64}`, filename: doc.filename };
  } catch (error) {
    return fallo(ports, error, 'urlDescargaFactura');
  }
}

/** Owner only; a payment in the global CFDI and valid fiscal data. */
export async function solicitarFacturaNominalCon(
  ports: FacturasPorts,
  paymentId: string,
): Promise<SolicitudFacturaResult> {
  try {
    const { businessId, email } = await ports.member('owner');
    await solicitarFacturaNominal(
      { source: ports.source, mode: ports.mode(), inbox: ports.inbox() },
      { businessId, paymentId, fiscal: await ports.fiscalOf(businessId, email) },
    );
    return { ok: true };
  } catch (error) {
    return fallo(ports, error, 'solicitarFacturaNominal');
  }
}
