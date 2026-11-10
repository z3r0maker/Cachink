import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { uploadedBytesHeaders } from '@xangarro/config/security';
import { latestProductImage } from '@xangarro/data-pg';

import { withTenant } from '@/server/db';
import { readSession } from '@/server/session';

/**
 * `GET /api/productos/<productId>/imagen` — a product's current photo for the
 * signed-in business (ADR-134, B-19): the newest row of `product_images`,
 * 404 when there is none or the newest is a tombstone. Every role: whoever
 * sees the catalogue sees its photos. The cache is private and revalidated
 * on every view, so «Quitar foto» shows at once; the ETag is the bytes'
 * hash, so an unchanged photo costs a 304 and no body.
 *
 * The bytes came from a device's push. The table only takes `image/webp`,
 * but this response does not lean on that: it is sandboxed like every other
 * upload (audit F-01).
 */
const CACHE = 'private, no-cache';
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const notFound = () =>
  NextResponse.json(
    { error: 'No encontrado' },
    { status: 404, headers: { 'Cache-Control': CACHE } },
  );

export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const { productId } = await params;
  if (!ULID.test(productId)) return notFound();

  const photo = await withTenant(session.business_id, (tx) => latestProductImage(tx, productId));
  if (photo === null || photo.bytes === null) return notFound();

  const bytes = Buffer.from(photo.bytes, 'base64');
  const etag = `"${createHash('sha256').update(bytes).digest('base64url').slice(0, 22)}"`;
  const headers = { ...uploadedBytesHeaders(), ETag: etag, 'Cache-Control': CACHE };
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: { ...headers, 'Content-Type': photo.mime, 'Content-Length': String(bytes.byteLength) },
  });
}
