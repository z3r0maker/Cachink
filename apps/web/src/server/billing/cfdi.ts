import 'server-only';

import {
  assertKeyMatchesMode,
  CfdiError,
  CloseCfdiPeriodUseCase,
  CloseMonthlyGlobalCfdiUseCase,
  FacturapiPacProvider,
  IssueCfdiForPaymentUseCase,
  readCfdiIssuerConfig,
  readCfdiMode,
  readFacturapiConfig,
  RecordPaymentForCfdiUseCase,
  RecordRefundForCfdiUseCase,
  type EnvSource,
  type HttpFetch,
  type IssuedCfdiRepository,
  type PacProvider,
} from '@xangarro/application/cfdi';
import {
  cfdiInvoicePaidListener,
  type InvoicePaidListener,
  type RefundListener,
} from '@xangarro/application/billing';

import { supportInboxFromEnv } from '../support-inbox';
import { pgIssuedCfdiRepository } from './cfdi-repository';
import { billingDb, stripeClient } from './config';
import { pgTenantFiscalSource } from './fiscal-source';

/**
 * The CFDI composition root (N-33, ADR-070).
 *
 * - `CFDI_MODE` — `off` (default; production at launch), `test` (staging),
 *   `live`. `test`/`live` also need `FACTURAPI_API_KEY` (`sk_test_` /
 *   `sk_live_`, matching the mode) and `CFDI_LUGAR_EXPEDICION`.
 * - Records go to `cfdi_payments` on `BILLING_DATABASE_URL`; items to the
 *   admin inbox (`ADMIN_INGEST_URL`, `ADMIN_INGEST_SECRET`).
 * - Fiscal data: the business's own (P-08), read through
 *   `xangarro.tenant_fiscal()` on the same connection; incomplete data routes
 *   the payment to the monthly global CFDI.
 */

interface CfdiParts {
  readonly mode: ReturnType<typeof readCfdiMode>;
  readonly repo: IssuedCfdiRepository;
  readonly pac: PacProvider | null;
  readonly issuer: ReturnType<typeof readCfdiIssuerConfig> | null;
}

const platformFetch: HttpFetch = (url, init) => fetch(url, init);

/** The PAC for `test` / `live`, its key checked against the mode; throws for `off`. */
export function livePacProvider(env: EnvSource = process.env): PacProvider {
  const mode = readCfdiMode(env);
  if (mode === 'off') throw new CfdiError('CFDI_PROVIDER_CONFIG', 'CFDI_MODE=off no usa PAC');
  const config = readFacturapiConfig(env);
  assertKeyMatchesMode(mode, config.livemode);
  return new FacturapiPacProvider({ ...config, fetch: platformFetch });
}

function parts(env: EnvSource = process.env): CfdiParts {
  const mode = readCfdiMode(env);
  const repo = pgIssuedCfdiRepository(billingDb());
  if (mode === 'off') return { mode, repo, pac: null, issuer: null };
  return { mode, repo, pac: livePacProvider(env), issuer: readCfdiIssuerConfig(env) };
}

/** What `invoice.paid` does for the CFDI, per `CFDI_MODE`. */
export function liveCfdiInvoiceListener(): InvoicePaidListener {
  const { mode, repo, pac, issuer } = parts();
  const issue = pac && issuer ? new IssueCfdiForPaymentUseCase(repo, pac, issuer) : null;
  const inbox = supportInboxFromEnv();
  const useCase = new RecordPaymentForCfdiUseCase({
    mode,
    repo,
    inbox,
    issue,
    fiscal: pgTenantFiscalSource(billingDb()),
  });
  return cfdiInvoicePaidListener(useCase);
}

/** What `charge.refunded` does for the CFDI: bookkeeping + an inbox item (N-33). */
export function liveCfdiRefundListener(): RefundListener {
  const useCase = new RecordRefundForCfdiUseCase({
    repo: pgIssuedCfdiRepository(billingDb()),
    inbox: supportInboxFromEnv(),
  });
  return {
    onChargeRefunded: async (refund) => {
      const invoiceId = await invoiceOfCharge(refund.chargeId);
      if (invoiceId === null) {
        return { outcome: 'applied', businessId: refund.businessId, refund: 'unresolved' };
      }
      const result = await useCase.execute({
        invoiceId,
        businessId: refund.businessId,
        refundId: refund.refundId,
        amountRefundedCentavos: refund.amountRefundedCentavos,
      });
      return {
        outcome: 'applied',
        businessId: refund.businessId,
        refund: result.outcome === 'marked' ? 'recorded' : result.outcome,
      };
    },
  };
}

/**
 * The refunded charge's invoice, the way the API writes it now
 * (2026-08-26): neither a Charge nor a Refund names its invoice, but the
 * charge's payment intent is indexed by the Invoice Payments API —
 * charge → payment_intent → invoicePayment.invoice. A Stripe failure is
 * thrown, so the webhook 500s and Stripe retries.
 */
async function invoiceOfCharge(chargeId: string): Promise<string | null> {
  const stripe = stripeClient();
  const charge = await stripe.charges.retrieve(chargeId);
  const intent = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  if (intent === null) return null;
  const payments = await stripe.invoicePayments.list({
    payment: { type: 'payment_intent', payment_intent: intent },
  });
  const invoice = payments.data[0]?.invoice;
  return typeof invoice === 'string' ? invoice : (invoice?.id ?? null);
}

/** The monthly close the cron runs. */
export function liveCloseCfdiPeriod(now: () => Date = () => new Date()): CloseCfdiPeriodUseCase {
  const { mode, repo, pac, issuer } = parts();
  const close = pac && issuer ? new CloseMonthlyGlobalCfdiUseCase(repo, pac, issuer, now) : null;
  return new CloseCfdiPeriodUseCase({ mode, repo, inbox: supportInboxFromEnv(), close, now });
}
