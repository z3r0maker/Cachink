/**
 * The two-letter monogram for businesses without a logo (N-20). Derived
 * from the name deterministically: the first letters of the first two
 * significant words — articles and connectors are skipped so
 * «Abarrotes y Cremería …» never yields «AY»; honorifics count (Doña, Don). One word yields its first
 * two letters. The artboards show hand-picked pairs (DC, AM); code needs
 * one rule that always holds.
 */

const PUENTES = new Set([
  'y',
  'o',
  'e',
  'de',
  'del',
  'la',
  'el',
  'los',
  'las',
  'un',
  'una',
  'san',
  'santa',
]);

/** «Taquería Doña Cuca» → «TD», «Plomería Lozano» → «PL», «SURTIDORA» → «SU». */
export function monograma(nombre: string): string {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0 && !PUENTES.has(p.toLocaleLowerCase('es-MX')));
  if (palabras.length === 0) {
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    return (limpio.slice(0, 2) || 'XG').toLocaleUpperCase('es-MX');
  }
  if (palabras.length === 1) {
    return palabras[0]!.slice(0, 2).toLocaleUpperCase('es-MX');
  }
  const letras = palabras
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('');
  return letras.toLocaleUpperCase('es-MX');
}
