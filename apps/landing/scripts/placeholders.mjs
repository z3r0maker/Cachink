/**
 * The legal drafts mark missing data as `[CORREO PRIVACIDAD]`, `[FECHA]`, `[24]`.
 * The live aviso and terms once published several of them; the prerender now
 * refuses any page whose visible text still carries one.
 */

/**
 * A bracketed gap: its first word is all capitals or digits (`[N]`, `[24]`,
 * `[PAÍS / REGIÓN]`, `[PLAZO — confirmar …]`). A link's text, `[Aviso de
 * Privacidad]`, starts lower-case after its first letter and is left alone.
 */
const GAP = /\[[A-ZÁÉÍÓÚÑ0-9]+(?:[\s/—–-][^\]]*)?\]/g;

/**
 * The gaps left in a page's visible text. Scripts and styles are dropped
 * whatever their case or closing-tag spacing; this reads our own build output
 * and sanitises nothing.
 */
export function placeholdersIn(html) {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script[^>]*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return [...new Set(text.match(GAP) ?? [])];
}
