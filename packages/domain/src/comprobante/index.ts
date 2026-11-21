export {
  buildComprobanteHtml,
  escapeHtml,
  type BuildComprobanteOptions,
} from './build-comprobante-html';
export { sanitiseSvg, svgIsSafe, dominantColor, dominantSvgFill } from './brand';
export { luminanciaRelativa, tintaSobre, TINTA_CLARA, TINTA_OSCURA } from './contraste';
export { monograma } from './monograma';
export { esLogoAdmitido, LOGO_MIMES, MAX_LOGO_BYTES } from './logo-negocio';
export type {
  Comprobante,
  ConceptoComprobante,
  DestinoComprobante,
  MetodoPagoComprobante,
  NegocioComprobante,
  OpcionesRender,
  PlantillaComprobante,
} from './datos';
export {
  comprobanteSvg,
  comprobanteClasicoSvg,
  comprobanteMinimalSvg,
  comprobanteModernoSvg,
  comprobanteTicketSvg,
} from './svg/index.js';
