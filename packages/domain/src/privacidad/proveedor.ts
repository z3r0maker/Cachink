/**
 * Who sells Xangarro, as the law asks it to be shown (LFPC art. 76 Bis I and
 * III): the supplier's name, RFC, address and a contact for questions and
 * complaints. Checkout, the billing emails and the public cancel page print it
 * from here.
 *
 * From the constancia de situación fiscal (inicio de operaciones 2026-10-15).
 * The domicilio is the fiscal one; it changes once the company has its own.
 * The phone is a placeholder until the company has its own line: the number on
 * the constancia is not one to publish (`docs/launch/production-readiness.md` §0).
 */
export const PROVEEDOR = {
  razonSocial: 'MEXIA, S.A.S.',
  rfc: 'MEX261015US8',
  domicilio: 'Paseo Puesta del Sol 4150, Colonia Lomas Altas, C.P. 45128, Zapopan, Jalisco',
  correo: 'hola@xangarro.mx',
  /** As written for people. A placeholder until the company's own line exists. */
  telefono: '99 9999 9999',
} as const;

/** «MEXIA, S.A.S. · Paseo Puesta del Sol 4150, …, Zapopan, Jalisco». */
export const PROVEEDOR_LINEA = `${PROVEEDOR.razonSocial} · ${PROVEEDOR.domicilio}`;
