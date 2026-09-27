import type { ProductIcon } from '../comun/product-icons';

/**
 * «Ícono sugerido por el nombre» (OpProductoNuevo): the first family whose
 * word appears in the name, accents ignored; `utensils` when none does.
 * Ventas' drawer uses it too, so a line looks like its catalogue tile.
 */
const REGLAS: readonly (readonly [readonly string[], ProductIcon])[] = [
  [['pollo', 'alitas', 'pierna'], 'drumstick'],
  [['jamon', 'pierna'], 'ham'],
  [['consome', 'caldo', 'pozole', 'menudo', 'sopa'], 'soup'],
  [['cerveza', 'embotellada', 'botella'], 'bottle'],
  [['refresco', 'soda'], 'soda'],
  [['agua', 'horchata', 'jamaica', 'jugo', 'licuado', 'cafe', 'atole'], 'glass'],
  [['salsa'], 'droplet'],
  [['guacamole', 'nopal', 'cebolla'], 'leafy'],
  [['ensalada', 'verdura'], 'salad'],
  [['gringa', 'quesadilla', 'volcan', 'torta', 'sope', 'tostada', 'pizza'], 'pizza'],
  [['orden', 'guisado', 'olla'], 'pot'],
  [
    ['taco', 'pastor', 'suadero', 'bistec', 'chorizo', 'tripa', 'carne', 'arrachera', 'carnitas'],
    'flame',
  ],
];

export function iconoPorNombre(nombre: string): ProductIcon {
  const n = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return REGLAS.find(([palabras]) => palabras.some((w) => n.includes(w)))?.[1] ?? 'utensils';
}

/** The picker's choices, with the word the screen reader says. */
export const ICONOS_ELEGIBLES: readonly (readonly [ProductIcon, string])[] = [
  ['flame', 'Carne asada'],
  ['drumstick', 'Pollo'],
  ['ham', 'Jamón'],
  ['pizza', 'Antojito'],
  ['pot', 'Guisado'],
  ['soup', 'Caldo'],
  ['glass', 'Agua fresca'],
  ['soda', 'Refresco'],
  ['bottle', 'Botella'],
  ['leafy', 'Verdura'],
  ['salad', 'Ensalada'],
  ['droplet', 'Salsa'],
  ['utensils', 'Otro'],
];
