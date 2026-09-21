import 'server-only';

import { buildComprobantePdf } from '@xangarro/application';
import { comprobanteSvg, type Comprobante, type PlantillaComprobante } from '@xangarro/domain';
import { NextResponse } from 'next/server';

import { ANCHO_IMPRESION, ANCHO_WHATSAPP, aspectoDe, comprobantePng } from './render';

/**
 * One comprobante, either salida (N-20): the WhatsApp PNG (1080 px, card
 * floating on the off-white with its hard shadow) or the print PDF (flat
 * page at the template's paper size — media carta, 58 mm roll, A6). Both
 * come from the same domain SVG; only the destination differs.
 */

export type FormatoComprobante = 'png' | 'pdf';

export function formatoValido(valor: string | null): valor is FormatoComprobante {
  return valor === 'png' || valor === 'pdf';
}

export function plantillaValida(valor: string | null): PlantillaComprobante | null {
  if (valor === 'moderno' || valor === 'ticket' || valor === 'minimal' || valor === 'clasico') {
    return valor;
  }
  return null;
}

export async function responderComprobante(
  c: Comprobante,
  plantilla: PlantillaComprobante,
  formato: FormatoComprobante,
): Promise<NextResponse> {
  const svg = comprobanteSvg(plantilla, c, {
    destino: formato === 'pdf' ? 'impresion' : 'whatsapp',
  });
  const png = await comprobantePng(svg, formato === 'pdf' ? ANCHO_IMPRESION : ANCHO_WHATSAPP);
  if (formato === 'png') {
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="comprobante-${c.folio}.png"`,
      },
    });
  }
  const aspecto = await aspectoDe(png);
  const blob = await buildComprobantePdf({
    pngDataUri: `data:image/png;base64,${png.toString('base64')}`,
    plantilla,
    aspecto,
  });
  return new NextResponse(new Uint8Array(await blob.arrayBuffer()), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="comprobante-${c.folio}.pdf"`,
    },
  });
}
