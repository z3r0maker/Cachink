import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { uploadedBytesHeaders } from '@xangarro/config/security';
import { logoPublico } from '@xangarro/data-pg';

import { db } from '@/server/db';

/**
 * A business's logo, public (N-19): it prints on receipts, so the URL is
 * shareable by design. Reads go through `xangarro.logo_publico()` — no tenant
 * claim, and only these two columns ever come out. The ETag is the bytes'
 * hash, so a re-upload changes it and one that didn't change the bytes is a
 * 304.
 *
 * The bytes are an owner's upload served on the portal's origin, and an SVG
 * opened in a tab is a document. So the response is sandboxed whatever it
 * holds (audit F-01): the upload gate is a second layer, never the only one.
 * `next.config.mjs` sets the same policy on this path; see `HEADER_RULES`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ businessId: string }> },
): Promise<NextResponse> {
  const { businessId } = await params;
  if (!/^[0-9A-HJKMNP-TV-Z]{26}$/.test(businessId)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
  const logo = await logoPublico(db(), businessId);
  if (logo === null) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const etag = `"${createHash('sha256').update(logo.bytes).digest('base64url').slice(0, 22)}"`;
  return new NextResponse(new Uint8Array(logo.bytes), {
    headers: {
      ...uploadedBytesHeaders(),
      'Content-Type': logo.mime,
      'Content-Length': String(logo.bytes.byteLength),
      ETag: etag,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
