/**
 * Icon picker constants — categories and their icons for the product
 * icon selection screen.
 */

import type { ProductIcon } from '@cachink/domain';

export interface IconCategory {
  readonly key: string;
  readonly label: string;
  readonly icons: readonly ProductIcon[];
}

export const ICON_CATEGORIES: readonly IconCategory[] = [
  {
    key: 'alimentos',
    label: 'Alimentos',
    icons: [
      'beef', 'apple', 'cake', 'candy', 'cookie', 'croissant',
      'drumstick', 'egg', 'fish', 'ice-cream-cone', 'leaf', 'nut',
      'pizza', 'popcorn', 'salad', 'sandwich', 'soup',
    ],
  },
  {
    key: 'bebidas',
    label: 'Bebidas',
    icons: [
      'beer', 'coffee', 'cup-soda', 'glass-water', 'grape',
      'martini', 'milk', 'wine',
    ],
  },
  {
    key: 'comercio',
    label: 'Comercio',
    icons: [
      'gift', 'gem', 'shirt', 'sport-shoe', 'shopping-bag', 'store',
      'tag', 'watch',
    ],
  },
  {
    key: 'servicios',
    label: 'Servicios',
    icons: [
      'car', 'hammer', 'hard-hat', 'paintbrush', 'plug', 'scissors',
      'spray-can', 'stethoscope', 'wrench',
    ],
  },
  {
    key: 'belleza',
    label: 'Belleza y Cuidado',
    icons: ['bath', 'sparkles', 'sun', 'droplets', 'heart'],
  },
  {
    key: 'hogar',
    label: 'Hogar y Oficina',
    icons: [
      'armchair', 'book', 'briefcase', 'lamp', 'pen-tool', 'printer',
    ],
  },
  {
    key: 'general',
    label: 'General',
    icons: [
      'archive', 'box', 'clipboard-list', 'flower-2', 'music',
      'package', 'palette', 'paw-print', 'pill', 'star', 'ticket',
      'trophy', 'zap',
    ],
  },
] as const;
