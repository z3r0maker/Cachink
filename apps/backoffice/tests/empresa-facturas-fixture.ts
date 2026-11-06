import type { FacturaRecibida } from '@xangarro/application/corp';
import type { FacturaDelMes } from '@xangarro/data-corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml, type CfdiDePrueba } from '@xangarro/testing/corp';

/** E-11's received invoices as the Facturas list reads them, for its view tests. */
export const factura = (o: CfdiDePrueba, f: Partial<FacturaRecibida> = {}): FacturaRecibida => ({
  cfdi: leerCfdi(cfdiXml(o)),
  archivo: 'f.xml',
  estado: 'registrada',
  estadoSat: 'vigente',
  categoria: 'administracion',
  projectId: null,
  entryId: 'e1',
  pagoEntryId: null,
  ...f,
});

export const delMes = (
  f: FacturaRecibida,
  revertida = false,
  fechas: Partial<Pick<FacturaDelMes, 'pagadaEl' | 'revertidaEl'>> = {},
): FacturaDelMes => ({
  factura: f,
  revertida,
  pagadaEl: null,
  revertidaEl: null,
  ...fechas,
});

/** A lawyer's invoice on credit, registered and still owed. */
export const despacho = delMes(
  factura(
    {
      fecha: '2026-10-30',
      metodoPago: 'PPD',
      emisor: { rfc: 'DJU010101AB1', nombre: 'Despacho jurídico, S.C.' },
      subtotal: '4000.00',
      iva: '640.00',
      isr: '0.00',
      ivaRetenido: '0.00',
    },
    { entryId: 'e2' },
  ),
);
