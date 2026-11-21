/**
 * Avisos' own words about the owner (M-25, board RvPatrones): always «los
 * patrones», with the verb in plural. One copy for the phone's screen
 * (`ui/screens/Avisos`) and the web caja's (`operador/avisos`).
 */
export const AVISOS_COPY = {
  /** Under the title. */
  sub: 'Lo que te mandan los patrones y lo que la caja te avisa',
  /** The owner's tab. */
  tab: 'De los patrones',
  /** Who signs a message. */
  firma: 'Los patrones',
  /** A message's kind, above its title. */
  tipoMensaje: 'Mensaje de los patrones',
  /** Nothing at all. */
  vacio: 'Ni mensajes de los patrones ni avisos de tu caja.',
  /** The owner's tab with everything read. */
  nadaNuevo: 'Los patrones no te han escrito nada nuevo.',
  /** The reply sheet's title. */
  responder: 'Responder a los patrones',
  /** The reply box's placeholder. */
  cuentales: 'Cuéntales a los patrones lo que recuerdas',
  /** Over a reply already sent. */
  enviada: 'Les mandaste tu respuesta a los patrones',
} as const;
