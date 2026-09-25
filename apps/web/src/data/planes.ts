import { PRICE_SUBTOTAL_CENTAVOS, type BillingInterval } from '@xangarro/application/billing';
import type { PlanId } from '@xangarro/domain';

/**
 * **The pricing on this screen is real.** The handoff says to copy it verbatim,
 * so every pitch, price, CTA and feature line below is transcribed from
 * `Xangarro Portal - Suscripcion.dc.html`, not paraphrased.
 *
 * Plan ids are the machine values renamed by C-11 (ADR-059); the Spanish names
 * are what the customer reads.
 */
export interface PlanFeature {
  readonly label: string;
  readonly included: boolean;
}

export interface PlanCard {
  readonly id: PlanId;
  readonly name: string;
  readonly pitch: string;
  readonly cta: string;
  readonly includesLabel: string;
  readonly emphasis: boolean;
  readonly features: readonly PlanFeature[];
}

/**
 * A plan's price as the cards show it (N-01): billing's one price table, in
 * pesos, always «+ IVA» (prices are plus IVA, ADR-067). Annual is 10 × monthly
 * — «2 meses gratis». The free plan has no interval.
 */
export interface Precio {
  readonly price: string;
  readonly period: string;
}

export function precioDePlan(plan: PlanId, interval: BillingInterval): Precio {
  if (plan === 'xangarrito') return { price: '0', period: 'para siempre gratis' };
  const pesos = PRICE_SUBTOTAL_CENTAVOS[plan][interval] / 100;
  return {
    price: pesos.toLocaleString('es-MX'),
    period: interval === 'month' ? 'MXN / mes + IVA' : 'MXN / año + IVA',
  };
}

const on = (label: string): PlanFeature => ({ label, included: true });
const off = (label: string): PlanFeature => ({ label, included: false });

export const PLAN_CARDS: readonly PlanCard[] = [
  {
    id: 'xangarrito',
    name: 'Xangarrito',
    pitch: 'Para arrancar sin gastar un peso.',
    cta: 'Crear cuenta gratis',
    includesLabel: 'Incluye',
    emphasis: false,
    features: [
      on('1 usuario'),
      on('Registro de ventas y gastos'),
      on('Hasta 300 transacciones al mes'),
      on('Catálogo de hasta 50 productos'),
      on('Dashboard básico'),
      off('Sin inventario'),
      off('Sin estados financieros NIF'),
      off('Sin escaneo de código de barras'),
    ],
  },
  {
    id: 'xangarro',
    name: 'Xangarro',
    pitch: 'Para el negocio que ya vende y quiere crecer.',
    cta: 'Empezar ahora',
    includesLabel: 'Todo en Xangarrito, más:',
    emphasis: true,
    features: [
      on('2 usuarios (dueño + empleado)'),
      on('Catálogo de hasta 1 000 productos'),
      on('Escaneo de código de barras'),
      on('Estados financieros NIF (B-2, B-3, B-6)'),
      on('Informe mensual para tu contador'),
      on('Hasta 10 000 transacciones al mes'),
      on('Reportes de ventas y gastos'),
    ],
  },
  {
    id: 'xangarrote',
    name: 'Xangarrote',
    pitch: 'Para cuando el negocio ya te quedó chico.',
    cta: 'Probar 14 días gratis',
    includesLabel: 'Todo en Xangarro, más:',
    emphasis: false,
    features: [
      on('5 usuarios'),
      on('Hasta 30 000 transacciones al mes'),
      on('Catálogo de hasta 5 000 productos'),
      on('Multi-sucursal (próximamente)'),
      on('Reportes avanzados y comparativos'),
      on('Exportación a PDF y Excel'),
      on('Soporte prioritario por WhatsApp'),
      on('Configuración de permisos por usuario'),
      on('Historial de auditoría completo'),
    ],
  },
];

/** The Asesor block the design renders separately from the plan cards. */
export interface AsesorTier {
  readonly name: string;
  readonly oneLiner: string;
  readonly items: readonly string[];
  readonly emphasis: boolean;
}

export const ASESOR_TIERS: readonly AsesorTier[] = [
  {
    name: 'Xangarrito',
    oneLiner: 'Un aviso por semana para no perder el pulso.',
    items: ['1 aviso por semana', 'Importa tu catálogo con una foto'],
    emphasis: false,
  },
  {
    name: 'Xangarro',
    oneLiner: 'Don Cuentas te avisa cada día qué atender.',
    items: [
      '"Para ti hoy" diario',
      'Conclusiones en tus estados financieros',
      'Explicación de diferencias en caja',
      'Metas con seguimiento diario',
      '1 Diagnóstico gratis a los 90 días',
    ],
    emphasis: true,
  },
  {
    name: 'Xangarrote',
    oneLiner: 'Cada mes, un diagnóstico de tu negocio y un plan para tu meta.',
    items: [
      'Todo lo de Xangarro',
      'Diagnóstico mensual',
      '"¿Cuánto puedo sacar?"',
      'Pronóstico "¿Me alcanza?"',
      'Estrategia para tu meta',
    ],
    emphasis: false,
  },
];
