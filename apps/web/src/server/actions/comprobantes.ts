'use server';

import type { BusinessId } from '@xangarro/domain';
import { revalidatePath } from 'next/cache';

import { requireMember } from '../auth';
import { processLogo } from '../branding/logo';
import { portalOrigin } from '../billing/origin';
import { withTenant } from '../db';
import { logoPublico, upsertLogo } from '@xangarro/data-pg';
import { pgBusinessesRepository } from '../repositories/businesses';
import { reportError } from '../observability/report';

/**
 * Negocio → Comprobantes (N-19): the logo upload and the receipt branding
 * fields. One action each, both owner/admin, both inside the tenant
 * transaction — the logo bytes and the `businesses` row change together or
 * not at all, and every businesses write is logged for the phones (§5).
 */

export type SubirLogoResult =
  | { ok: true; brandColor: string | null }
  | { ok: false; message: string };

export async function subirLogo(form: FormData): Promise<SubirLogoResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const file = form.get('logo');
    if (!(file instanceof File)) return { ok: false, message: 'Elige un archivo.' };

    const processed = await processLogo(file);
    // Absolute on purpose: the wire's `logoUrl` is a URL the phone fetches,
    // so a relative path would parse today and fetch nothing on a device.
    const logoUrl = `${await portalOrigin()}/api/logos/${businessId}`;
    await withTenant(businessId, async (tx) => {
      await upsertLogo(tx, { businessId, mime: processed.mime, bytes: processed.bytes });
      const repo = pgBusinessesRepository(tx, businessId);
      const current = await repo.findById(businessId);
      const patch: Parameters<typeof repo.update>[1] = {
        logoUrl,
        // Extraction is a convenience: it never overwrites a chosen colour.
        ...(current?.brandColor == null && processed.brandColor !== null
          ? { brandColor: processed.brandColor }
          : {}),
      };
      await repo.update(businessId, patch);
    });
    revalidatePath('/negocio');
    return { ok: true, brandColor: processed.brandColor };
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'NOT_PERMITTED') {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'subirLogo' });
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar el logo.',
    };
  }
}

export interface ComprobantesForm {
  readonly receiptTemplate: 'clasico' | 'moderno' | 'ticket' | 'minimal';
  readonly receiptLeyenda: string;
  readonly addressPrint: boolean;
  readonly direccion: string;
  readonly whatsapp: string;
  readonly brandColor: string;
}

export type GuardarComprobantesResult = { ok: true } | { ok: false; message: string };

const HEX = /^#[0-9a-fA-F]{6}$/;
const TELEFONO = /^[\d\s+\-()]{7,20}$/;

export async function guardarComprobantes(
  form: ComprobantesForm,
): Promise<GuardarComprobantesResult> {
  try {
    const session = await requireMember('admin');
    const businessId = session.business_id as BusinessId;
    const leyenda = form.receiptLeyenda.trim();
    const whatsapp = form.whatsapp.trim();
    const direccion = form.direccion.trim();
    if (leyenda.length > 280)
      return { ok: false, message: 'La leyenda no pasa de 280 caracteres.' };
    if (direccion.length > 140)
      return { ok: false, message: 'La dirección no pasa de 140 caracteres.' };
    if (whatsapp !== '' && !TELEFONO.test(whatsapp)) {
      return { ok: false, message: 'El WhatsApp no parece un teléfono.' };
    }
    if (!HEX.test(form.brandColor)) {
      return { ok: false, message: 'El color debe ser un hexadecimal como #d4a017.' };
    }
    await withTenant(businessId, (tx) =>
      pgBusinessesRepository(tx, businessId).update(businessId, {
        receiptTemplate: form.receiptTemplate,
        receiptLeyenda: leyenda === '' ? null : leyenda,
        addressPrint: form.addressPrint,
        direccion: direccion === '' ? null : direccion,
        whatsapp: whatsapp === '' ? null : whatsapp,
        brandColor: form.brandColor.toLowerCase(),
      }),
    );
    revalidatePath('/negocio');
    return { ok: true };
  } catch (error) {
    if ((error as { code?: string } | null)?.code === 'NOT_PERMITTED') {
      return { ok: false, message: (error as Error).message };
    }
    reportError(error, { endpoint: 'guardarComprobantes' });
    return { ok: false, message: 'No pudimos guardar. Intenta de nuevo.' };
  }
}

/** Read-side for the screen without touching the action file's clients. */
export async function logoActual(businessId: string): Promise<boolean> {
  return withTenant(businessId, (tx) => logoPublico(tx, businessId)).then((l) => l !== null);
}
