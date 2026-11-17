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

/** The gaps left in a page's visible text (scripts and tags removed). */
export function placeholdersIn(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
  return [...new Set(text.match(GAP) ?? [])];
}
