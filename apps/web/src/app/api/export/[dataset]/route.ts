import { NextResponse } from 'next/server';

import { readSession } from '@/server/session';
import { buildExport, isDataset } from '@/server/export/datasets';

/**
 * `GET /api/export/<dataset>` → an .xlsx download.
 *
 * A route handler rather than a server action because the result is a *file*:
 * the browser needs a real response with `Content-Disposition` so the download
 * carries a filename, and an action returns a value to JavaScript instead.
 *
 * It is a read, so `viewer` may use it — exporting is open to every role
 * including the contador, which `canExport()` already says. What it is not is
 * public: the dataset name arrives in the URL, so it is checked against a
 * closed union before it reaches a query, and the tenant comes from the signed
 * cookie rather than from anything the caller can type.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dataset: string }> },
): Promise<NextResponse> {
  const session = await readSession();
  if (session === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { dataset } = await params;
  if (!isDataset(dataset)) {
    return NextResponse.json({ error: `No exportamos "${dataset}"` }, { status: 404 });
  }

  const { filename, bytes } = await buildExport(dataset, session.business_id);

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      // An export is a snapshot of live rows; a cached one is a stale one.
      'Cache-Control': 'no-store',
    },
  });
}
