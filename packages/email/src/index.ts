/**
 * `@xangarro/email` — transactional email for the portal and the admin
 * console (B-14).
 *
 * Why a package of its own: both Next apps send email, so the templates and
 * the Resend / dev-outbox adapters must live in one place (CLAUDE.md §2.3);
 * they need React and a provider SDK, which `@xangarro/application` must not
 * depend on. The `EmailSender` port and the use cases stay in
 * `@xangarro/application/email`; this package implements and renders for them.
 * Server-only: nothing here belongs in a client bundle.
 */
export { renderEmail, fechaLarga, pesos, entero } from './render.js';
export {
  renderActivationCodeEmail,
  type ActivationCodeEmailProps,
} from './templates/activation-code.js';
export { planName, priceLine } from './templates/plans.js';
export { renderTrialEmail, type TrialEmailProps } from './templates/trial.js';
export {
  renderUsageThresholdEmail,
  type UsageThresholdEmailProps,
} from './templates/usage-threshold.js';
export {
  renderStaffDigestEmail,
  type DigestLine,
  type DigestSection,
  type StaffDigestProps,
} from './templates/staff-digest.js';
export {
  renderPasswordResetEmail,
  renderMagicLinkEmail,
  type AuthLinkEmailProps,
} from './templates/auth-links.js';
export { renderGenericNoticeEmail, type GenericNoticeProps } from './templates/generic-notice.js';
export {
  renderPaymentFailedEmail,
  type PaymentFailedEmailProps,
} from './templates/payment-failed.js';
export { renderWelcomeEmail, type WelcomeEmailProps } from './templates/welcome.js';
export {
  renderFacturaIssuedEmail,
  type FacturaIssuedEmailProps,
} from './templates/factura-issued.js';
export { resendSender, type ResendClient, type ResendSenderOptions } from './adapters/resend.js';
export { outboxSender, toEml, type OutboxOptions } from './adapters/outbox.js';
export {
  emailSenderFromEnv,
  emailTransport,
  DEFAULT_EMAIL_FROM,
  type EmailEnv,
  type EmailTransport,
  type FromEnvOptions,
} from './adapters/from-env.js';
