import {
  FEATURE_FLAG_KEYS,
  PLATFORM_AVAILABLE,
  PLAN_LIMITS,
  type FeatureFlagKey,
  type FeatureFlags,
  type PlanId,
} from '@xangarro/domain';

import { SESSION } from '../fixtures/business';

export interface Field {
  readonly label: string;
  readonly value: string | null;
}

export interface Section {
  readonly title: string;
  readonly tone: 'hero' | 'info' | 'peach' | 'purple';
  readonly fields: readonly Field[];
}

/** A `null` value renders "Falta por completar" in amber — an incomplete field. */
export const SECTIONS: readonly Section[] = [
  {
    title: 'Datos generales',
    tone: 'hero',
    fields: [
      { label: 'Nombre del negocio', value: 'Taquería Don Pedro' },
      { label: 'Giro', value: 'Mezcla de productos y servicios' },
      { label: 'Ciudad', value: 'Guadalajara, Jalisco' },
      { label: 'Teléfono', value: '33 1234 5678' },
    ],
  },
  {
    title: 'Datos fiscales',
    tone: 'info',
    fields: [
      { label: 'RFC', value: 'XAXX010101000' },
      { label: 'Régimen', value: 'RESICO' },
      { label: 'Domicilio fiscal', value: null },
      { label: 'Inicio del ejercicio', value: '01/ene/2026' },
    ],
  },
  {
    title: 'Contacto y comprobantes',
    tone: 'peach',
    fields: [
      { label: 'Correo de contacto', value: 'pedro@taqueriadonpedro.mx' },
      { label: 'WhatsApp para comprobantes', value: '33 1234 5678' },
      { label: 'Leyenda en el ticket', value: '¡Gracias por su preferencia!' },
      { label: 'Dirección que se imprime', value: 'Av. Chapultepec 120' },
    ],
  },
  {
    title: 'Preferencias',
    tone: 'purple',
    fields: [
      { label: 'Moneda', value: 'MXN' },
      { label: 'Zona horaria', value: 'America/Mexico_City' },
      { label: 'Formato de fecha', value: 'dd/mmm/aaaa' },
      { label: 'Cierre de día', value: '23:00' },
    ],
  },
];

export const FLAG_LABEL: Readonly<Record<FeatureFlagKey, string>> = {
  stock: 'Inventario / Stock',
  barcode: 'Lector de código de barras',
  ventasCredito: 'Ventas a Crédito',
  conversionMateriaPrima: 'Conversión de Materia Prima',
  conversionAutomatica: 'Conversión Automática',
  auditoriaInventario: 'Auditoría de Inventario',
  merma: 'Merma',
};

export const FLAG_DESC: Readonly<Record<FeatureFlagKey, string>> = {
  stock: 'Controla las cantidades de tus productos',
  barcode: 'Escanea productos con la cámara del teléfono',
  ventasCredito: 'Entrega productos a clientes con pago posterior',
  conversionMateriaPrima: 'Convierte materia prima en productos (ej: bolsa de café → tazas)',
  conversionAutomatica: 'Convierte automáticamente al vender cuando no hay stock suficiente',
  auditoriaInventario: 'Conteo físico periódico para validar cantidades',
  merma: 'Registra pérdidas por caducidad, daño o preparación',
};

/**
 * The three levels, resolved from the domain rather than restated: platform
 * availability, then plan entitlement, then the tenant's own switch. A flag is
 * editable only when the first two are true (F-06, P-15).
 */
export interface FlagRow {
  readonly key: FeatureFlagKey;
  readonly disponible: boolean;
  readonly enTuPlan: boolean;
  readonly activada: boolean;
}

export function flagRows(flags: FeatureFlags, planId: PlanId): readonly FlagRow[] {
  return FEATURE_FLAG_KEYS.map((key) => ({
    key,
    disponible: PLATFORM_AVAILABLE[key],
    enTuPlan: PLAN_LIMITS[planId].features.includes(key),
    activada: flags[key] && PLATFORM_AVAILABLE[key],
  }));
}

/** Plan-level capabilities have no tenant switch — they are read-only rows. */
export const CAPABILITY_ROWS: readonly (readonly [string, string])[] = [
  ['Estados financieros NIF', SESSION.capabilities.estadosFinancieros ? 'Incluido' : 'No incluido'],
  ['Informe mensual PDF', SESSION.capabilities.informeMensual ? 'Incluido' : 'No incluido'],
  ['Permisos por usuario', SESSION.capabilities.permisosPorUsuario ? 'Incluido' : 'No incluido'],
  ['Nivel de Asesor', SESSION.capabilities.asesor],
];
