import { NextResponse } from 'next/server';

import { TEMPLATE_HEADERS } from '@/lib/import-productos';
import { buildSheet } from '@/server/export/workbook';
import { readSession } from '@/server/session';

/**
 * `GET /api/import/productos` — the import template (P-07). Its headers are
 * the parser's own `TEMPLATE_HEADERS`, so the template and the parser cannot
 * disagree. One example row; no `stock_inicial` (ADR-081).
 */
type Header = (typeof TEMPLATE_HEADERS)[number];

const EXAMPLE: Record<Header, string | number> = {
  sku: 'TAC-010',
  nombre: 'Taco de bistec',
  categoria: 'Producto Terminado',
  unidad: 'pza',
  costo_unitario: 11.5,
  precio_venta: 28,
  seguir_stock: 'sí',
  umbral_stock_bajo: 10,
  icono: 'beef',
};

export async function GET(): Promise<NextResponse> {
  if ((await readSession()) === null) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const columns = TEMPLATE_HEADERS.map((h) => ({ header: h, value: (r: typeof EXAMPLE) => r[h] }));
  const bytes = await buildSheet('Productos', columns, [EXAMPLE]);
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla-productos.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
