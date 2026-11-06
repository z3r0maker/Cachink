'use server';

import { clientIp } from '@xangarro/auth-core';
import { consentimientoDeNovedades, reconsentimiento, type ConsentGrant } from '@xangarro/domain';
import { recordPrivacyConsent } from '@xangarro/data-pg';
import { headers } from 'next/headers';

import { failure } from '../action-errors';
import { requireMember } from '../auth';
import { db } from '../db';
import { avisoDeVersion, avisoVigente, ipHash } from '../legal/aviso';
import { estadoPrivacidadDe } from '../privacidad/estado';

/**
 * «Privacidad y mis datos» (ADR-137): every member manages their own consent,
 * so any role may call these, always for the session's own account. Each
 * change is new rows in the append-only ledger, with the same evidence as at
 * signup (the IP's hash, the user agent).
 */
export type PrivacidadResult = { ok: true } | { ok: false; message: string };

async function registrar(grants: readonly ConsentGrant[]): Promise<void> {
  const session = await requireMember('viewer');
  const h = await headers();
  const ctx = {
    userId: session.sub,
    businessId: session.business_id,
    ipHash: ipHash(clientIp(h)),
    userAgent: h.get('user-agent') ?? '',
  };
  await db().transaction(async (tx) => {
    for (const g of grants) await recordPrivacyConsent(tx, ctx, g);
  });
}

/** The novedades switch, recorded against the aviso the person accepted. */
export async function cambiarNovedades(on: boolean): Promise<PrivacidadResult> {
  try {
    const session = await requireMember('viewer');
    const estado = await estadoPrivacidadDe(session.sub);
    const aviso =
      (estado.aceptado === null ? null : avisoDeVersion(estado.aceptado.version)) ?? avisoVigente();
    await registrar([consentimientoDeNovedades(aviso, on)]);
    return { ok: true };
  } catch (error) {
    return failure(error, 'privacidad/novedades', {
      retry: 'No pudimos guardar tu cambio y no se cambió nada. Intenta otra vez.',
    });
  }
}

/** «Acepto el aviso nuevo»: express for necesarias, novedades carried over as they were. */
export async function aceptarAvisoNuevo(): Promise<PrivacidadResult> {
  try {
    const session = await requireMember('viewer');
    const estado = await estadoPrivacidadDe(session.sub);
    await registrar(reconsentimiento(avisoVigente(), estado.novedades));
    return { ok: true };
  } catch (error) {
    return failure(error, 'privacidad/aceptar', {
      retry: 'No pudimos guardar tu aceptación y no se cambió nada. Intenta otra vez.',
    });
  }
}
