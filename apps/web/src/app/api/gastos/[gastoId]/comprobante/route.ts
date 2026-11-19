import { NextResponse } from 'next/server';

import { uploadedBytesHeaders } from '@xangarro/config/security';

import { withTenant } from '@/server/db';
import { pgExpenseReceiptsReader } from '@/server/repositories/expense-receipts';
import { readSession } from '@/server/session';

/**
 * `GET /api/gastos/<gastoId>/comprobante` — a gasto's receipt photo for the
 * signed-in business (ADR-149, M-18): the newest row of `expense_receipts`,
 * 404 when the gasto has none. Every role: whoever sees the gasto in
 * Movimientos sees its receipt. The cache is private and revalidated on every
 * view, so a receipt that arrives later shows at once; the ETag is the
 * bytes' SHA-256, computed by Postgres, so an unchanged photo costs a 304.
 *
 * The bytes came from a device's push. The table only takes `image/webp`,
 * but this response does not lean on that: it is sandboxed like every other
 * upload (audit F-01), as `GET /api/productos/<id>/imagen` is.
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
  { params }: { params: Promise<{ gastoId: string }> },
): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const { gastoId } = await params;
  if (!ULID.test(gastoId)) return notFound();

  const receipt = await withTenant(session.business_id, (tx) =>
    pgExpenseReceiptsReader(tx).archivo(gastoId),
  );
  if (receipt === null) return notFound();

  const etag = `"${receipt.hash}"`;
  const headers = { ...uploadedBytesHeaders(), ETag: etag, 'Cache-Control': CACHE };
  if (request.headers.get('if-none-match') === etag) {
    return new NextResponse(null, { status: 304, headers });
  }
  const bytes = Buffer.from(receipt.bytes, 'base64');
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      ...headers,
      'Content-Type': receipt.mime,
      'Content-Length': String(bytes.byteLength),
    },
  });
}
