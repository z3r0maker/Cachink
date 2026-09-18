import 'server-only';

import {
  assertKeyMatchesMode,
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
  type TenantFiscalSource,
} from '@xangarro/application/cfdi';
import { cfdiInvoicePaidListener, type InvoicePaidListener } from '@xangarro/application/billing';

import { supportInboxFromEnv } from '../support-inbox';
import { pgIssuedCfdiRepository } from './cfdi-repository';
import { billingDb } from './config';

/**
 * The CFDI composition root (N-33, ADR-070).
 *
 * - `CFDI_MODE` — `off` (default; production at launch), `test` (staging),
 *   `live`. `test`/`live` also need `FACTURAPI_API_KEY` (`sk_test_` /
 *   `sk_live_`, matching the mode) and `CFDI_LUGAR_EXPEDICION`.
 * - Records go to `cfdi_payments` on `BILLING_DATABASE_URL`; items to the
 *   admin inbox (`ADMIN_INGEST_URL`, `ADMIN_INGEST_SECRET`).
 *
 * Fiscal data: the portal has no RFC / régimen / uso / CP fields on main yet
 * (P-10), so every payment routes to the monthly global CFDI until it does.
 */
export const noFiscalDataYet: TenantFiscalSource = { fiscalOf: () => Promise.resolve(null) };

interface CfdiParts {
  readonly mode: ReturnType<typeof readCfdiMode>;
  readonly repo: IssuedCfdiRepository;
  readonly pac: PacProvider | null;
  readonly issuer: ReturnType<typeof readCfdiIssuerConfig> | null;
}

const platformFetch: HttpFetch = (url, init) => fetch(url, init);

function parts(env: EnvSource = process.env): CfdiParts {
  const mode = readCfdiMode(env);
  const repo = pgIssuedCfdiRepository(billingDb());
  if (mode === 'off') return { mode, repo, pac: null, issuer: null };
  const config = readFacturapiConfig(env);
  assertKeyMatchesMode(mode, config.livemode);
  const pac = new FacturapiPacProvider({ ...config, fetch: platformFetch });
  return { mode, repo, pac, issuer: readCfdiIssuerConfig(env) };
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
    fiscal: noFiscalDataYet,
  });
  return cfdiInvoicePaidListener(useCase);
}

/** The monthly close the cron runs. */
export function liveCloseCfdiPeriod(now: () => Date = () => new Date()): CloseCfdiPeriodUseCase {
  const { mode, repo, pac, issuer } = parts();
  const close = pac && issuer ? new CloseMonthlyGlobalCfdiUseCase(repo, pac, issuer, now) : null;
  return new CloseCfdiPeriodUseCase({ mode, repo, inbox: supportInboxFromEnv(), close, now });
}
