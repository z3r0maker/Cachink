'use server';

import {
  BillingError,
  billingStatusSnapshot,
  type BillingStatusSnapshot,
} from '@xangarro/application/billing';
import { getBusiness, subscriptionsOfBusiness } from '@xangarro/data-pg';

import { BETA_NO_CHARGE_MESSAGE, betaNoCharge } from './beta';
import { requireMember } from '../auth';
import { withTenant } from '../db';
import { reportError } from '../observability/report';
import { publishableKey } from './config';
import { recordGeo } from '../geo/record';
import { liveBillingUseCases } from './live';
import { portalOrigin as origin } from './origin';

/**
 * The billing server functions the Suscripción screen (P-10) calls. No screen
 * is edited here: P-10 wires the buttons.
 *
 * Owner only — buying, switching and cancelling are the owner's (ADR-053 Q11).
 * Each returns a URL to send the browser to, or a message for a toast. The
 * business and the owner's email come from the signed session, never from the
 * caller.
 */
export type BillingActionResult = { ok: true; url: string } | { ok: false; message: string };

const SUSCRIPCION = '/suscripcion';

async function owner() {
  const session = await requireMember('owner');
  const business = await withTenant(session.business_id, (tx) => getBusiness(tx));
  return {
    id: session.business_id,
    name: business?.nombre ?? 'Mi negocio',
    email: session.email,
  };
}

function fail(error: unknown, where: string): BillingActionResult {
  const code = (error as { code?: string } | null)?.code;
  if (error instanceof BillingError || code === 'NOT_PERMITTED') {
    return { ok: false, message: (error as Error).message };
  }
  reportError(error, { endpoint: where });
  return { ok: false, message: 'No pudimos abrir el pago. Intenta de nuevo en un momento.' };
}

/** [Contratar este plan]: Stripe Checkout, card only, either interval, no trial (ADR-105). */
export async function iniciarPrueba(plan: string, interval: string): Promise<BillingActionResult> {
  if (betaNoCharge()) return { ok: false, message: BETA_NO_CHARGE_MESSAGE };
  try {
    const base = await origin();
    const url = await liveBillingUseCases().trial.execute({
      business: await owner(),
      plan,
      interval,
      successUrl: `${base}${SUSCRIPCION}?pago=listo&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}${SUSCRIPCION}`,
    });
    await recordGeo('compra');
    return { ok: true, url };
  } catch (error) {
    return fail(error, 'iniciarPrueba');
  }
}

/** [Pagar por transferencia]: the annual plan by SPEI; returns the hosted invoice with the CLABE. */
export async function pagarAnualPorSpei(plan: string): Promise<BillingActionResult> {
  if (betaNoCharge()) return { ok: false, message: BETA_NO_CHARGE_MESSAGE };
  try {
    const url = await liveBillingUseCases().spei.execute({ business: await owner(), plan });
    await recordGeo('compra');
    return { ok: true, url };
  } catch (error) {
    return fail(error, 'pagarAnualPorSpei');
  }
}

/** [Administrar suscripción]: Stripe's Customer Portal (card, plan change, cancel). */
export async function administrarSuscripcion(): Promise<BillingActionResult> {
  try {
    const session = await requireMember('owner');
    const url = await liveBillingUseCases().portal.execute({
      businessId: session.business_id,
      returnUrl: `${await origin()}${SUSCRIPCION}`,
    });
    return { ok: true, url };
  } catch (error) {
    return fail(error, 'administrarSuscripcion');
  }
}

/** What cancelling or resuming answers the screen: the end date, or a sentence. */
export type CancelActionResult =
  | { ok: true; endsAt: string | null }
  | { ok: false; message: string };

const NO_CAMBIO =
  'No pudimos cancelar tu suscripción y no se cambió nada. Revisa tu conexión e intenta otra vez; si sigue, escríbenos a hola@xangarro.mx.';

/** A refusal keeps its own sentence; anything else is reported and says nothing changed. */
function failCancel(error: unknown, where: string, fallback: string): CancelActionResult {
  const code = (error as { code?: string } | null)?.code;
  if (error instanceof BillingError || code === 'NOT_PERMITTED') {
    return { ok: false, message: (error as Error).message };
  }
  reportError(error, { endpoint: where });
  return { ok: false, message: fallback };
}

/**
 * [Cancelar suscripción] (LFPC 76 Bis, ADR-132): one tap, no confirmation;
 * the plan ends at the end of the paid period. Owner only.
 */
export async function cancelarSuscripcion(): Promise<CancelActionResult> {
  try {
    const session = await requireMember('owner');
    const r = await liveBillingUseCases().cancel.execute({
      businessId: session.business_id,
      channel: 'portal',
      requestedBy: session.sub,
    });
    return { ok: true, endsAt: r.endsAt };
  } catch (error) {
    return failCancel(error, 'cancelarSuscripcion', NO_CAMBIO);
  }
}

/** [Seguir con mi plan]: takes the cancellation back until the plan's end. Owner only. */
export async function seguirConMiPlan(): Promise<CancelActionResult> {
  try {
    const session = await requireMember('owner');
    await liveBillingUseCases().resume.execute({ businessId: session.business_id });
    return { ok: true, endsAt: null };
  } catch (error) {
    return failCancel(
      error,
      'seguirConMiPlan',
      'No pudimos reanudar tu plan y no se cambió nada. Intenta otra vez en un momento.',
    );
  }
}

/**
 * What the Suscripción screen shows: plan, status, interval, next charge (or
 * trial end). `null` is the free plan. Any member may look.
 */
export async function estadoSuscripcion(): Promise<BillingStatusSnapshot | null> {
  const session = await requireMember('viewer');
  return withTenant(session.business_id, async (tx) =>
    billingStatusSnapshot(await subscriptionsOfBusiness(tx, session.business_id)),
  );
}

/** For P-10, should it ever render Stripe.js; `null` when unset. */
export async function stripePublishableKey(): Promise<string | null> {
  return publishableKey();
}
