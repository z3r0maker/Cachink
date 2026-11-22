/**
 * The judge's `dedupe_key` vocabulary (S-13): `área/acción` across the app,
 * rendered into `prompts/judge.md`. The síntoma stays the judge's own. A fixed
 * list makes two corridas that hit the same thing give the same key, which is
 * what dedup across corridas and S-13's recall both read; without it the
 * first sensitivity run named one total `caja/total` and `caja/ticket-total`.
 */
export const KEY_VOCABULARY: Readonly<Record<string, readonly string[]>> = {
  acceso: ['vincular-caja', 'elegir-operador', 'nip', 'iniciar-sesion'],
  caja: [
    'abrir-turno',
    'catalogo',
    'ticket',
    'total',
    'cobrar',
    'pago-efectivo',
    'fiado',
    'comprobante',
    'deshacer',
    'cerrar-turno',
  ],
  ventas: ['lista', 'detalle', 'cancelar-venta'],
  gastos: ['registrar', 'lista'],
  inventario: ['existencias', 'movimiento'],
  sincronizacion: ['enviar', 'recibir', 'estado'],
  onboarding: ['registro', 'confirmar-correo', 'asistente', 'siguiente', 'plan'],
  portal: ['navegacion', 'inicio'],
  agente: ['selector', 'herramienta', 'mision'],
};

export function inVocabulary(prefix: string): boolean {
  const [area, accion, ...rest] = prefix.split('/');
  if (area === undefined || accion === undefined || rest.length > 0) return false;
  return KEY_VOCABULARY[area]?.includes(accion) ?? false;
}

/** One line per área, as the prompt lists them. */
export function vocabularyText(): string {
  return Object.entries(KEY_VOCABULARY)
    .map(([area, acciones]) => `- \`${area}\`: ${acciones.map((a) => `\`${a}\``).join(', ')}`)
    .join('\n');
}
