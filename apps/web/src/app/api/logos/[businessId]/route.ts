import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

import { logoPublico } from '@xangarro/data-pg';

import { db } from '@/server/db';

/**
 * A business's logo, public (N-19): it prints on receipts, so the URL is
 * shareable by design. Reads go through `xangarro.logo_publico()` — no tenant
 * claim, and only these two columns ever come out. The ETag is the bytes'
 * hash, so a re-upload changes it and one that didn't change the bytes is a
 * 304.
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
      'Content-Type': logo.mime,
      'Content-Length': String(logo.bytes.byteLength),
      ETag: etag,
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
