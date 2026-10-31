/**
 * A CFDI 4.0 as a supplier stamps it, for the domain's tests (E-11). The
 * default is board CD-06d's: a contadora's honorarios to MEXIA, with ISR and
 * IVA withheld. Application and e2e tests build theirs with
 * `@xangarro/testing`'s `cfdiXml`; the domain cannot depend on that package.
 */
export const RFC_MEXIA = 'MEX261001AB1';
export const UUID = '6F1C2B3A-4D5E-4F60-8A7B-9C0D1E2F3A4B';

export interface Partes {
  readonly comprobante?: string;
  readonly receptor?: string;
  readonly impuestos?: string;
  readonly complemento?: string;
  readonly conceptos?: string;
}

const COMPROBANTE =
  'Version="4.0" Serie="H" Folio="118" Fecha="2026-10-28T10:15:00" SubTotal="3500.00" ' +
  'Moneda="MXN" Total="3336.67" TipoDeComprobante="I" Exportacion="01" MetodoPago="PUE" ' +
  'FormaPago="03" LugarExpedicion="06600" Sello="aGVsbG8gd29ybGQ=ZXhhbXBsZQ12AB34CD"';

const IMPUESTOS =
  '<cfdi:Impuestos TotalImpuestosRetenidos="723.33" TotalImpuestosTrasladados="560.00">' +
  '<cfdi:Retenciones><cfdi:Retencion Impuesto="001" Importe="350.00"/>' +
  '<cfdi:Retencion Impuesto="002" Importe="373.33"/></cfdi:Retenciones>' +
  '<cfdi:Traslados><cfdi:Traslado Base="3500.00" Impuesto="002" TipoFactor="Tasa" ' +
  'TasaOCuota="0.160000" Importe="560.00"/></cfdi:Traslados></cfdi:Impuestos>';

const CONCEPTOS =
  '<cfdi:Conceptos><cfdi:Concepto ClaveProdServ="84111500" Cantidad="1" ClaveUnidad="E48" ' +
  'Descripcion="Honorarios contables de octubre" ValorUnitario="3500.00" Importe="3500.00" ' +
  'ObjetoImp="02"><cfdi:Impuestos><cfdi:Traslados><cfdi:Traslado Base="3500.00" ' +
  'Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="560.00"/>' +
  '</cfdi:Traslados></cfdi:Impuestos></cfdi:Concepto></cfdi:Conceptos>';

export function cfdi(p: Partes = {}): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" ' +
    'xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" ' +
    `${p.comprobante ?? COMPROBANTE}>` +
    '<cfdi:Emisor Rfc="LOMA800101AB2" Nombre="ANA LÓPEZ MARTÍNEZ" RegimenFiscal="612"/>' +
    (p.receptor ??
      `<cfdi:Receptor Rfc="${RFC_MEXIA}" Nombre="MEXIA" DomicilioFiscalReceptor="06600" ` +
        'RegimenFiscalReceptor="626" UsoCFDI="G03"/>') +
    (p.conceptos ?? CONCEPTOS) +
    (p.impuestos ?? IMPUESTOS) +
    (p.complemento ??
      `<cfdi:Complemento><tfd:TimbreFiscalDigital Version="1.1" UUID="${UUID.toLowerCase()}" ` +
        'FechaTimbrado="2026-10-28T10:16:02"/></cfdi:Complemento>') +
    '</cfdi:Comprobante>'
  );
}

/** The default comprobante attributes with `cambios` applied (`Attr="nuevo"`). */
export function comprobante(cambios: Record<string, string>): string {
  return Object.entries(cambios).reduce(
    (acc, [k, v]) =>
      new RegExp(`\\b${k}="`).test(acc)
        ? acc.replace(new RegExp(`\\b${k}="[^"]*"`), `${k}="${v}"`)
        : `${acc} ${k}="${v}"`,
    COMPROBANTE,
  );
}
