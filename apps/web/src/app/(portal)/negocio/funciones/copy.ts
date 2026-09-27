import type { FeatureFlagKey } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

/**
 * How CfgFunciones names each Función, in the owner's words, with its glyph
 * and tint. The order is the board's: inventory first, the Xangarrote
 * extras last.
 */
export interface FuncionCopy {
  readonly nombre: string;
  readonly desc: string;
  readonly fondo: string;
  readonly icono: string;
}

export const ORDEN: readonly FeatureFlagKey[] = [
  'stock',
  'barcode',
  'merma',
  'ventasCredito',
  'conversionMateriaPrima',
  'conversionAutomatica',
  'auditoriaInventario',
];

export const FUNCION: Readonly<Record<FeatureFlagKey, FuncionCopy>> = {
  stock: {
    nombre: 'Inventario y stock',
    desc: 'Lleva cuánto te queda de cada producto; la caja descuenta al vender.',
    fondo: colors.greenSoft,
    icono: 'M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
  },
  barcode: {
    nombre: 'Lector de código de barras',
    desc: 'La caja escanea productos con la cámara del teléfono.',
    fondo: colors.blueSoft,
    icono: 'M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14',
  },
  merma: {
    nombre: 'Se echó a perder o se dañó (merma)',
    desc: 'Anota lo que se tira por caducidad, daño o preparación.',
    fondo: colors.peachSoft,
    icono: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5',
  },
  ventasCredito: {
    nombre: 'Ventas a crédito (fiado)',
    desc: 'Se lleva hoy y te paga después; lleva la cuenta de cada cliente.',
    fondo: colors.purpleSoft,
    icono:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6',
  },
  conversionMateriaPrima: {
    nombre: 'Conversión de materia prima',
    desc: 'Convierte materia prima en productos; por ejemplo, una bolsa de café en tazas.',
    fondo: colors.yellowSoft,
    icono: 'M12 3v12M6 9l6 6 6-6M4 21h16',
  },
  conversionAutomatica: {
    nombre: 'Conversión automática',
    desc: 'Convierte solo al vender cuando no alcanza el stock.',
    fondo: colors.blueSoft,
    icono: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  },
  auditoriaInventario: {
    nombre: 'Auditoría de inventario',
    desc: 'Conteo físico cada cierto tiempo para validar cantidades.',
    fondo: colors.greenSoft,
    icono:
      'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2ZM9 14l2 2 4-4',
  },
};
