import type { ProductIcon } from '@xangarro/domain';

/**
 * The icon a new product starts with, read from its name (ADR-107). The owner
 * types «Taco de suadero» and the caja tile already shows a taco-ish glyph; a
 * name it does not know gets a box. The owner can always pick another one.
 *
 * Whole words, accents and case aside, first word that matches wins — «Pan de
 * muerto» is bread, not whatever «muerto» might suggest. Plurals match their
 * singular («tacos» → taco).
 */
const PALABRAS: ReadonlyArray<readonly [ProductIcon, readonly string[]]> = [
  [
    'sandwich',
    [
      'taco',
      'torta',
      'gringa',
      'quesadilla',
      'sope',
      'tostada',
      'burrito',
      'sandwich',
      'sandwiche',
      'hamburguesa',
      'hotdog',
      'tamal',
      'gordita',
      'flauta',
      'enchilada',
      'chilaquil',
    ],
  ],
  [
    'beef',
    [
      'carne',
      'res',
      'bistec',
      'suadero',
      'pastor',
      'arrachera',
      'chorizo',
      'cecina',
      'barbacoa',
      'carnita',
    ],
  ],
  ['drumstick', ['pollo', 'alita', 'pierna', 'muslo', 'nugget']],
  ['fish', ['pescado', 'camaron', 'marisco', 'ceviche', 'atun', 'filete']],
  ['soup', ['sopa', 'caldo', 'pozole', 'consome', 'menudo', 'birria']],
  ['pizza', ['pizza']],
  ['salad', ['ensalada', 'verdura', 'nopal']],
  ['egg', ['huevo']],
  ['croissant', ['pan', 'concha', 'cuerno', 'bolillo', 'telera', 'croissant', 'bizcocho', 'dona']],
  ['cake', ['pastel', 'pay', 'flan', 'gelatina', 'cupcake']],
  ['cookie', ['galleta']],
  ['candy', ['dulce', 'chocolate', 'paleta', 'chicle', 'caramelo']],
  ['ice-cream-cone', ['helado', 'nieve', 'raspado']],
  ['popcorn', ['palomita', 'papa', 'fritura', 'chicharron']],
  ['apple', ['fruta', 'manzana', 'platano', 'mango', 'naranja', 'sandia', 'melon']],
  ['nut', ['cacahuate', 'nuez', 'semilla', 'pepita']],
  ['leaf', ['hierba', 'te', 'cilantro', 'tortilla', 'maiz', 'masa']],
  ['coffee', ['cafe', 'capuchino', 'latte', 'americano', 'expreso', 'atole', 'champurrado']],
  ['cup-soda', ['refresco', 'soda', 'coca', 'jugo', 'licuado', 'malteada', 'frappe', 'smoothie']],
  ['glass-water', ['agua', 'horchata', 'jamaica', 'limonada', 'naranjada']],
  ['beer', ['cerveza', 'chela', 'michelada', 'caguama']],
  ['wine', ['vino', 'mezcal', 'tequila']],
  ['milk', ['leche', 'yogurt', 'queso']],
  ['shirt', ['playera', 'camisa', 'blusa', 'ropa', 'vestido', 'pantalon', 'sudadera', 'gorra']],
  ['sport-shoe', ['tenis', 'zapato', 'huarache', 'sandalia', 'bota']],
  ['gift', ['regalo', 'detalle', 'arreglo']],
  ['gem', ['anillo', 'arete', 'collar', 'pulsera', 'joya']],
  ['scissors', ['corte', 'cabello', 'barba', 'peinado', 'estetica']],
  ['sparkles', ['manicure', 'pedicure', 'maquillaje', 'facial', 'pestaña']],
  ['car', ['auto', 'carro', 'lavado', 'envio', 'flete', 'viaje']],
  ['wrench', ['reparacion', 'servicio', 'mantenimiento', 'instalacion', 'ajuste']],
  ['printer', ['copia', 'impresion', 'engargolado', 'escaneo']],
  ['pill', ['medicina', 'pastilla', 'jarabe', 'vitamina']],
  ['paw-print', ['croqueta', 'mascota', 'perro', 'gato']],
  ['flower-2', ['flor', 'ramo', 'planta']],
];

const INDICE: ReadonlyMap<string, ProductIcon> = new Map(
  PALABRAS.flatMap(([icon, palabras]) => palabras.map((p) => [sinAcentos(p), icon] as const)),
);

function sinAcentos(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function buscar(palabra: string): ProductIcon | undefined {
  const exacta = INDICE.get(palabra);
  if (exacta !== undefined) return exacta;
  if (palabra.endsWith('es'))
    return INDICE.get(palabra.slice(0, -2)) ?? INDICE.get(palabra.slice(0, -1));
  if (palabra.endsWith('s')) return INDICE.get(palabra.slice(0, -1));
  return undefined;
}

export function adivinaIcono(nombre: string): ProductIcon {
  for (const palabra of sinAcentos(nombre).split(/[^a-z0-9ñ]+/)) {
    const icon = palabra === '' ? undefined : buscar(palabra);
    if (icon !== undefined) return icon;
  }
  return 'package';
}

/** The quick row under the guess: the ten icons small businesses use most. */
export const SUGERIDOS: ReadonlyArray<{ readonly icon: ProductIcon; readonly label: string }> = [
  { icon: 'sandwich', label: 'Antojito' },
  { icon: 'beef', label: 'Carne' },
  { icon: 'drumstick', label: 'Pollo' },
  { icon: 'soup', label: 'Caldo' },
  { icon: 'cup-soda', label: 'Refresco' },
  { icon: 'coffee', label: 'Café' },
  { icon: 'croissant', label: 'Pan' },
  { icon: 'shirt', label: 'Ropa' },
  { icon: 'scissors', label: 'Servicio' },
  { icon: 'package', label: 'Otro' },
];
