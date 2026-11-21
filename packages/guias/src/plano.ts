/**
 * The one way Xangarro folds text for a search (ADR-163): accents and case
 * aside, so «revision» finds «Revisión de caja» and «codigo» finds «código».
 * The portal's ⌘K palette and the help search both read it from here.
 */
export const plano = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** A search's words, folded. A search of only spaces has none. */
export const palabras = (texto: string): readonly string[] =>
  plano(texto).split(/\s+/).filter(Boolean);
