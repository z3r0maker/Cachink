/**
 * Why an uploaded file is not a received invoice MEXIA can post (E-11).
 * Each `motivo` has its own sentence on board CD-06c.
 */
export type MotivoCfdiInvalido =
  | 'no_es_cfdi'
  | 'version'
  | 'no_es_ingreso'
  | 'complemento_pago'
  | 'sin_timbre'
  | 'moneda'
  | 'importes';

const MENSAJES: Record<MotivoCfdiInvalido, string> = {
  no_es_cfdi: 'No es el XML de una factura (CFDI).',
  version: 'Es un CFDI anterior a la versión 4.0; pídele al proveedor que la reexpida.',
  no_es_ingreso: 'No es una factura de compra: es una nota de crédito, nómina o traslado.',
  complemento_pago:
    'Es un complemento de pago: registra el pago desde la factura «Por pagar» que liquida.',
  sin_timbre: 'No está timbrada: le falta el folio fiscal (UUID) del SAT.',
  moneda: 'Está en una moneda que no podemos convertir, o le falta el tipo de cambio.',
  importes: 'Sus importes no cuadran: subtotal, impuestos y total no suman.',
};

export class CfdiInvalidoError extends Error {
  readonly code = 'CFDI_INVALIDO' as const;
  constructor(readonly motivo: MotivoCfdiInvalido) {
    super(MENSAJES[motivo]);
    this.name = 'CfdiInvalidoError';
  }
}
