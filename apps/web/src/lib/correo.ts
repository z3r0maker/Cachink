/** `pedro@taqueria.mx` → `p***@taqueria.mx`: a receipt names the inbox, not the person. */
export function enmascararCorreo(correo: string): string {
  const [usuario = '', dominio = ''] = correo.trim().toLowerCase().split('@');
  return dominio === '' ? usuario : `${usuario.charAt(0)}***@${dominio}`;
}

/** Shaped like an address: something, an at sign, a dot. The inbox is the real check. */
export const pareceCorreo = (valor: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
