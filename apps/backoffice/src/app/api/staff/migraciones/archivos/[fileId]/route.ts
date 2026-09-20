import { fileBytes, fileRow } from '@/server/db/assisted-imports';
import { db } from '@/server/db/client';
import { requireStaff } from '@/server/staff';

/**
 * Staff-only download of an assisted-import file (N-18). The path sits under
 * /api/staff/ — not a machine prefix, so the proxy's staff gate runs on it;
 * requireStaff re-checks server-side (the console's own ADR-080 rule). The
 * bytes leave only for allowlisted staff with a live AAL2 session.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> },
): Promise<Response> {
  await requireStaff();
  const { fileId } = await params;
  const [meta] = await fileRow(db(), fileId);
  if (meta === undefined) return new Response('Not found', { status: 404 });
  const file = await fileBytes(db(), fileId);
  if (file === null) return new Response('Purged', { status: 410 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': meta.mime,
      'Content-Disposition': `attachment; filename="${meta.filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
