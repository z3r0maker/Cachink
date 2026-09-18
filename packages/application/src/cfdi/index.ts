/**
 * N-33 — CFDI 4.0 for Xangarro's own subscription revenue (ADR-070).
 *
 * Provider-independent core: a `PacProvider` port, the use cases that decide
 * individual vs global CFDI and drive stamping / cancellation, and an
 * `IssuedCfdiRepository` port for idempotency. Adapters live in `./adapters`.
 * Not wired to Stripe or the portal yet (B-10).
 */

export * from './errors.js';
export * from './sat-catalogs.js';
export * from './types.js';
export * from './iva.js';
export * from './period.js';
export * from './fiscal-validation.js';
export * from './payment-validation.js';
export * from './payload-builder.js';
export * from './pac-provider.js';
export * from './issued-cfdi-repository.js';
export * from './in-memory-issued-cfdi-repository.js';
export * from './issue-cfdi-for-payment.js';
export * from './close-monthly-global-cfdi.js';
export * from './cancel-cfdi-for-refund.js';
