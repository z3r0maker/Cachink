/**
 * buildInformeMensualPdf — renders an `InformeMensual` into a PDF
 * Blob (P1C-M9-T02, Slice 3 C25).
 *
 * Layout:
 *   1. Header: business name + period label.
 *   2. Estado de Resultados table (NIF B-3 seven lines).
 *   3. Ventas por categoría table.
 *   4. Egresos por categoría table.
 *   5. Footer: "ISR referencial; consulta a tu contador" disclaimer.
 *
 * @react-pdf/renderer composes identically on mobile (Hermes) and
 * Tauri WebView — no platform-specific variant needed. Dynamically
 * imported to keep the cold-start bundle lean.
 */

import type * as ReactPdf from '@react-pdf/renderer';
import type { InformeMensual } from '@cachink/application';
import {
  formatMoney,
  type EstadoDeResultados,
  type ExpenseCategory,
  type Money,
  type SaleCategory,
} from '@cachink/domain';

type PdfNs = typeof ReactPdf;

type RowEntry = { label: string; value: string };

interface InformeViewModel {
  businessName: string;
  periodLabel: string;
  estadoRows: RowEntry[];
  ventasRows: RowEntry[];
  egresosRows: RowEntry[];
  disclaimer: string;
}

function buildViewModel(informe: InformeMensual, businessName: string): InformeViewModel {
  return {
    businessName,
    periodLabel: informe.yearMonth,
    estadoRows: estadoRowsOf(informe.estadoResultados),
    ventasRows: categoryRowsOf(informe.ventasPorCategoria),
    egresosRows: categoryRowsOf(informe.egresosPorCategoria),
    disclaimer: 'ISR referencial. Consulta a tu contador antes de declarar.',
  };
}

function estadoRowsOf(e: EstadoDeResultados): RowEntry[] {
  return [
    { label: 'Ingresos', value: formatMoney(e.ingresos) },
    { label: 'Costo de ventas', value: formatMoney(e.costoDeVentas) },
    { label: 'Utilidad bruta', value: formatMoney(e.utilidadBruta) },
    { label: 'Gastos operativos', value: formatMoney(e.gastosOperativos) },
    { label: 'Utilidad operativa', value: formatMoney(e.utilidadOperativa) },
    { label: 'ISR', value: formatMoney(e.isr) },
    { label: 'Utilidad neta', value: formatMoney(e.utilidadNeta) },
  ];
}

function categoryRowsOf<K extends SaleCategory | ExpenseCategory>(
  group: Record<K, Money>,
): RowEntry[] {
  return (Object.keys(group) as K[])
    .map((k) => ({ label: k as string, value: formatMoney(group[k]) }))
    .filter((r) => r.value !== '$0.00');
}

function makeStyles(ns: PdfNs): ReturnType<PdfNs['StyleSheet']['create']> {
  return ns.StyleSheet.create({
    page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
    h1: { fontSize: 18, fontWeight: 700, marginBottom: 6 },
    subtitle: { fontSize: 12, marginBottom: 16 },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 6 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      borderBottom: '1 solid #E4E4E0',
    },
    label: { fontSize: 11 },
    value: { fontSize: 11, fontWeight: 700 },
    footer: {
      marginTop: 24,
      padding: 10,
      backgroundColor: '#FFFBCC',
      borderRadius: 6,
    },
    footerText: { fontSize: 10, color: '#5A5A56' },
  });
}

type PdfDocumentElement =
  ReturnType<PdfNs['pdf']> extends {
    toBlob(): Promise<infer _>;
  }
    ? Parameters<PdfNs['pdf']>[0]
    : never;

function renderDocument(
  ns: PdfNs,
  styles: ReturnType<PdfNs['StyleSheet']['create']>,
  vm: InformeViewModel,
): PdfDocumentElement {
  const { Document, Page, Text, View } = ns;
  const Section = ({ title, rows }: { title: string; rows: RowEntry[] }): React.ReactElement => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.value}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{vm.businessName}</Text>
        <Text style={styles.subtitle}>Informe mensual — {vm.periodLabel}</Text>
        <Section title="Estado de Resultados" rows={vm.estadoRows} />
        <Section title="Ventas por categoría" rows={vm.ventasRows} />
        <Section title="Egresos por categoría" rows={vm.egresosRows} />
        <View style={styles.footer}>
          <Text style={styles.footerText}>{vm.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  ) as unknown as PdfDocumentElement;
}

export async function buildInformeMensualPdf(
  informe: InformeMensual,
  businessName: string,
): Promise<Blob> {
  const ns = await import('@react-pdf/renderer');
  const styles = makeStyles(ns);
  const vm = buildViewModel(informe, businessName);
  return ns.pdf(renderDocument(ns, styles, vm)).toBlob();
}

// Re-exported so tests can inspect the view-model without rendering.
export { buildViewModel };
