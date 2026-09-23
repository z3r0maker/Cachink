import type { BusinessId, Business } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { requireMember } from '@/server/auth';
import { withTenant } from '@/server/db';
import { pgBusinessesRepository } from '@/server/repositories/businesses';

import { ComprobantesScreen, type ComprobantesView } from './parts';

/**
 * Negocio → Comprobantes (N-19). Owner and admin edit; a viewer reads the
 * fields without the controls.
 */
export const dynamic = 'force-dynamic';

export default async function ComprobantesPage() {
  const session = await requireMember('viewer');
  const businessId = session.business_id as BusinessId;
  const business = await withTenant(session.business_id, (tx) =>
    pgBusinessesRepository(tx, businessId).findById(businessId),
  );
  return <ComprobantesScreen {...viewOf(session, business)} />;
}

function viewOf(
  session: Awaited<ReturnType<typeof requireMember>>,
  business: Business | null,
): ComprobantesView {
  return {
    mayWrite: session.member_role !== 'viewer',
    businessId: session.business_id,
    logoUrl: business?.logoUrl ?? null,
    form: formOf(business),
  };
}

const SIN_MARCA = {
  receiptTemplate: 'clasico',
  receiptLeyenda: '',
  addressPrint: false,
  direccion: '',
  whatsapp: '',
  // On-palette by default: a business that never picks a colour gets the
  // brand yellow, which is the accent the design's own artboard A uses.
  brandColor: colors.yellow,
} as const satisfies ComprobantesView['form'];

function formOf(business: Business | null): ComprobantesView['form'] {
  if (business === null) return { ...SIN_MARCA };
  return {
    receiptTemplate: business.receiptTemplate ?? SIN_MARCA.receiptTemplate,
    receiptLeyenda: business.receiptLeyenda ?? SIN_MARCA.receiptLeyenda,
    addressPrint: business.addressPrint ?? SIN_MARCA.addressPrint,
    direccion: business.direccion ?? SIN_MARCA.direccion,
    whatsapp: business.whatsapp ?? SIN_MARCA.whatsapp,
    brandColor: business.brandColor ?? SIN_MARCA.brandColor,
  };
}
