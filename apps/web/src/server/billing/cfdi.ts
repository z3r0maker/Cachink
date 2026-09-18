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
  type EnvSource,
  type HttpFetch,
  type IssuedCfdiRepository,
  type PacProvider,
} from '@xangarro/application/cfdi';
import { cfdiInvoicePaidListener, type InvoicePaidListener } from '@xangarro/application/billing';

import { supportInboxFromEnv } from '../support-inbox';
import { pgIssuedCfdiRepository } from './cfdi-repository';
import { billingDb } from './config';
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

/** The monthly close the cron runs. */
export function liveCloseCfdiPeriod(now: () => Date = () => new Date()): CloseCfdiPeriodUseCase {
  const { mode, repo, pac, issuer } = parts();
  const close = pac && issuer ? new CloseMonthlyGlobalCfdiUseCase(repo, pac, issuer, now) : null;
  return new CloseCfdiPeriodUseCase({ mode, repo, inbox: supportInboxFromEnv(), close, now });
}
