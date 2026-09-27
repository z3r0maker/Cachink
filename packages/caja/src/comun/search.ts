/** Accent- and case-insensitive text for searches (README: «insensible a acentos»). */
export const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Does any of `fields` contain `query` once both are normalised? Empty matches all. */
export const matches = (query: string, ...fields: readonly string[]): boolean => {
  const q = norm(query.trim());
  return q === '' || fields.some((f) => norm(f).includes(q));
};
