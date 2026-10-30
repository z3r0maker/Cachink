/**
 * A received CFDI 4.0 for the application tests (E-11): the same builder as
 * `@xangarro/testing/corp`, which the application cannot depend on (testing
 * → ui → application would be a cycle). Amounts are pesos with two decimals.
 */
export interface CfdiDePrueba {
  readonly uuid?: string;
  /** The RFC it is addressed to. */
  readonly receptor?: string;
  readonly emisor?: { readonly rfc: string; readonly nombre: string };
  /** `YYYY-MM-DD`. */
  readonly fecha?: string;
  readonly metodoPago?: 'PUE' | 'PPD';
  readonly concepto?: string;
  readonly subtotal?: string;
  readonly iva?: string;
  readonly isr?: string;
  readonly ivaRetenido?: string;
}

export const RFC_MEXIA_PRUEBA = 'MEX261001AB1';

const centavos = (pesos: string): bigint => {
  const [entero = '0', fraccion = ''] = pesos.split('.');
  return BigInt(entero) * 100n + BigInt(fraccion.padEnd(2, '0').slice(0, 2));
};
const pesos = (c: bigint): string => `${c / 100n}.${String(c % 100n).padStart(2, '0')}`;
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** A random folio fiscal, upper case. */
export function uuidDePrueba(): string {
  return crypto.randomUUID().toUpperCase();
}

function impuestos(iva: string, isr: string, ivaRetenido: string): string {
  const retenido = centavos(isr) + centavos(ivaRetenido);
  const retenciones =
    retenido === 0n
      ? ''
      : '<cfdi:Retenciones>' +
        `<cfdi:Retencion Impuesto="001" Importe="${isr}"/>` +
        `<cfdi:Retencion Impuesto="002" Importe="${ivaRetenido}"/></cfdi:Retenciones>`;
  return (
    `<cfdi:Impuestos TotalImpuestosRetenidos="${pesos(retenido)}" TotalImpuestosTrasladados="${iva}">` +
    retenciones +
    `<cfdi:Traslados><cfdi:Traslado Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" ` +
    `Importe="${iva}"/></cfdi:Traslados></cfdi:Impuestos>`
  );
}

const DEFECTO = {
  receptor: RFC_MEXIA_PRUEBA,
  emisor: { rfc: 'LOMA800101AB2', nombre: 'ANA LÓPEZ MARTÍNEZ' },
  fecha: '2026-10-28',
  metodoPago: 'PUE',
  concepto: 'Honorarios contables de octubre',
  subtotal: '3500.00',
  iva: '560.00',
  isr: '350.00',
  ivaRetenido: '373.33',
} as const;

export function cfdiXml(cambios: CfdiDePrueba = {}): string {
  const o = { ...DEFECTO, uuid: uuidDePrueba(), ...cambios };
  const { subtotal, iva, isr, ivaRetenido, emisor } = o;
  const total = centavos(subtotal) + centavos(iva) - centavos(isr) - centavos(ivaRetenido);
  const metodo = o.metodoPago;
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" ' +
    'xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="H" Folio="118" ' +
    `Fecha="${o.fecha}T10:15:00" SubTotal="${subtotal}" Moneda="MXN" ` +
    `Total="${pesos(total)}" TipoDeComprobante="I" Exportacion="01" MetodoPago="${metodo}" ` +
    `FormaPago="${metodo === 'PPD' ? '99' : '03'}" LugarExpedicion="06600" Sello="c2VsbG8=12AB34CD">` +
    `<cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${esc(emisor.nombre)}" RegimenFiscal="612"/>` +
    `<cfdi:Receptor Rfc="${o.receptor}" Nombre="MEXIA" UsoCFDI="G03"/>` +
    `<cfdi:Conceptos><cfdi:Concepto Cantidad="1" ClaveUnidad="E48" ` +
    `Descripcion="${esc(o.concepto)}" ` +
    `ValorUnitario="${subtotal}" Importe="${subtotal}" ObjetoImp="02"/></cfdi:Conceptos>` +
    impuestos(iva, isr, ivaRetenido) +
    `<cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="${o.uuid}" ` +
    'FechaTimbrado="2026-10-28T10:16:02"/></cfdi:Complemento>' +
    '</cfdi:Comprobante>'
  );
}
