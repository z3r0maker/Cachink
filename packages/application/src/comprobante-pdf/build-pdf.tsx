/**
 * buildComprobantePdf (N-20) — wraps a rendered comprobante PNG in a
 * print-sized PDF page: one page, one image, the template's exact paper
 * (media carta for Clásico/Moderno, the 58 mm roll for Ticket, A6 for
 * Minimal). The layout itself lives in the domain SVG — this is only the
 * paper, so web and phone print identically (the informe's one-document
 * pattern, P-34).
 */

import type { PlantillaComprobante } from '@xangarro/domain';

/** Millimetres of paper width per template (the fichas' print formats). */
const ANCHO_MM: Record<PlantillaComprobante, number> = {
  clasico: 140,
  moderno: 140,
  ticket: 58,
  minimal: 105,
};

const MM_A_PT = 72 / 25.4;

export interface EntradaComprobantePdf {
  /** The raster as a PNG data URI — the caller's side owns the bytes. */
  readonly pngDataUri: string;
  readonly plantilla: PlantillaComprobante;
  /** Raster aspect (height / width); the page height follows it. */
  readonly aspecto: number;
}

export async function buildComprobantePdf(entrada: EntradaComprobantePdf): Promise<Blob> {
  const ns = await import('@react-pdf/renderer');
  const { Document, Page, Image, StyleSheet } = ns;
  const anchoPt = ANCHO_MM[entrada.plantilla] * MM_A_PT;
  const altoPt = Math.ceil(anchoPt * entrada.aspecto);
  const styles = StyleSheet.create({
    pagina: { margin: 0, padding: 0 },
    imagen: { width: anchoPt, height: altoPt },
  });
  const dataUri = entrada.pngDataUri;
  const doc = (
    <Document>
      <Page size={[anchoPt, altoPt]} style={styles.pagina}>
        <Image src={dataUri} style={styles.imagen} />
      </Page>
    </Document>
  );
  return ns.pdf(doc).toBlob();
}
