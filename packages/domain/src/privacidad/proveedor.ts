/**
 * Who sells Xangarro, as the law asks it to be shown (LFPC art. 76 Bis I):
 * the supplier's name, address and a contact for questions and complaints.
 * Checkout, the billing emails and the public cancel page print it from here.
 *
 * The phone number is still missing (`docs/launch/production-readiness.md`);
 * nothing prints a placeholder in its place.
 */
export const PROVEEDOR = {
  razonSocial: 'MEXIA, S.A.S.',
  domicilio: 'Paseo Lomas Altas 524, interior 9, colonia Loma Real, C.P. 45129, Zapopan, Jalisco',
  correo: 'hola@xangarro.mx',
} as const;

export const TERMINOS_PUBLICO_URL = 'https://xangarro.mx/terminos' as const;

/** «MEXIA, S.A.S. · Paseo Lomas Altas 524, …, Zapopan, Jalisco». */
export const PROVEEDOR_LINEA = `${PROVEEDOR.razonSocial} · ${PROVEEDOR.domicilio}`;
