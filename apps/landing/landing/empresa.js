/**
 * Who, where and since when, stated once: the «Acerca de» page, the
 * Organization schema, llms-full.txt and both footers read it.
 * `scripts/landing-empresa.test.ts` keeps it equal to the portal's
 * `PROVEEDOR`: the landing is plain JS and does not import the domain.
 * The legal entity is MEXIA, S.A.S. (constituted 2026, folio
 * SAS20261038080); the aviso de privacidad in docs/legal/aviso names the
 * same razón social and domicilio.
 */
export const EMPRESA = {
  nombre: 'Xangarro',
  razonSocial: 'MEXIA, S.A.S.',
  rfc: 'MEX261015US8',
  domicilio: 'Paseo Puesta del Sol 4150, Colonia Lomas Altas',
  codigoPostal: '45128',
  ciudad: 'Zapopan',
  estado: 'Jalisco',
  pais: 'México',
  fundacion: '2026',
  /** For questions and complaints (LFPC art. 76 Bis III), as in `PROVEEDOR`. */
  correo: 'hola@xangarro.mx',
  /** As written for people; `telHref` makes it dialable. */
  telefono: '33 3190 0937',
};

/** «Paseo Puesta del Sol 4150, Colonia Lomas Altas, C.P. 45128, Zapopan, Jalisco». */
export const DOMICILIO_COMPLETO = `${EMPRESA.domicilio}, C.P. ${EMPRESA.codigoPostal}, ${EMPRESA.ciudad}, ${EMPRESA.estado}`;

/** `tel:+523331900937`: Mexican numbers dial with +52 and no spaces. */
export const telHref = (telefono) => `tel:+52${telefono.replace(/\D/g, '')}`;
