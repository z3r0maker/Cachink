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
