import type * as ReactPdfNs from '@react-pdf/renderer';
import type { TextoAviso } from '@xangarro/domain/corp';

/**
 * The incumplimiento notice as a letter-size PDF (E-20, board CD-13d). The
 * words are the domain's `textoDelAviso`, the same the screen shows, so the
 * PDF and the draft never differ. Helvetica, the PDF's own font, carries the
 * Spanish accents and «» without embedding one.
 */
type ReactPdf = typeof ReactPdfNs;

const S = {
  pagina: { padding: 64, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  fecha: { textAlign: 'right', marginBottom: 24 },
  titulo: { fontFamily: 'Helvetica-Bold', fontSize: 15, marginBottom: 16 },
  linea: { marginBottom: 2 },
  negrita: { fontFamily: 'Helvetica-Bold' },
  parrafo: { marginTop: 14 },
  item: { marginTop: 6, marginLeft: 14 },
  cita: { marginTop: 8, marginLeft: 14, fontFamily: 'Helvetica-Oblique' },
} as const;

function encabezado({ Text }: ReactPdf, texto: TextoAviso, fecha: string) {
  return (
    <>
      <Text style={S.fecha}>A {fecha}</Text>
      <Text style={S.titulo}>{texto.titulo}</Text>
      <Text style={S.linea}>
        <Text style={S.negrita}>Para: </Text>
        {texto.para}
      </Text>
      <Text style={S.linea}>
        <Text style={S.negrita}>De: </Text>
        {texto.de}
      </Text>
    </>
  );
}

function cuerpo({ Text, View }: ReactPdf, texto: TextoAviso) {
  return (
    <>
      {texto.cuerpo.map((p) => (
        <Text key={p} style={S.parrafo}>
          {p}
        </Text>
      ))}
      <View>
        {texto.lista.map((l) => (
          <Text key={l} style={S.item}>
            • {l}
          </Text>
        ))}
      </View>
      <Text style={S.parrafo}>{texto.conforme}</Text>
      <Text style={S.cita}>{texto.cita}</Text>
    </>
  );
}

export async function buildAvisoPdf(texto: TextoAviso, fecha: string): Promise<Uint8Array> {
  const ns = await import('@react-pdf/renderer');
  const { Document, Page } = ns;
  const doc = (
    <Document title={texto.titulo} language="es-MX">
      <Page size="LETTER" style={S.pagina}>
        {encabezado(ns, texto, fecha)}
        {cuerpo(ns, texto)}
      </Page>
    </Document>
  );
  return new Uint8Array(await ns.renderToBuffer(doc));
}
