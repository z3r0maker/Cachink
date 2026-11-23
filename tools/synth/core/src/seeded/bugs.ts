import { API_PATHS } from '@xangarro/contracts';

import type { Finding } from '../schemas/finding';
import type { PageMutation } from './page-script';
import type { NetRule } from './rules';

/**
 * Spec §9's eight seeded bugs (S-12): runtime mutations of the real app (a
 * script in the page, or a rule on its requests), never a change to its code.
 * Each is aimed at a scenario the smoke matrix runs, and declares what the
 * judge should find, so S-13 can measure recall by category and by runner.
 * The two network bugs also reach the phone, through the API proxy, with the
 * same rule; the rest are web-only.
 */
export interface SeededBug {
  readonly id: string;
  readonly title: string;
  /** The web scenario it shows in. */
  readonly scenario: string;
  readonly expected_category: Exclude<
    Finding['category'],
    'agent_failure' | 'out_of_scope_expectation'
  >;
  /** `área/acción`, the judge's key style (prompts/judge.md rule 5). */
  readonly expected_dedupe_prefix: string;
  readonly runners: readonly ('web' | 'phone')[];
  readonly web: { readonly page: PageMutation } | { readonly net: NetRule };
  readonly phone?: { readonly scenario: string; readonly net: NetRule };
}

/**
 * The register's push: what «saving» a sale means beyond the device. Paths
 * come from the wire contract, the one the register and the phone call.
 */
const PUSH = { methods: ['POST'], path: API_PATHS.syncPush } as const;
const PUSH_500: NetRule = { match: PUSH, effect: { status: 500 } };
const PUSH_SLOW: NetRule = { match: PUSH, effect: { delayMs: 8_000 } };
/** What tells the register who may cancel: the bootstrap and every pull. */
const PERMISOS: NetRule = {
  match: [
    { methods: ['POST'], path: API_PATHS.activate },
    { methods: ['GET', 'POST'], path: API_PATHS.syncPull },
  ],
  effect: { rewrite: 'grant-cancel' },
};

/** Where most of them show: the day's first sale, in Cobrar. */
const PRIMERA_VENTA = 'primera-venta';
const WEB = ['web'] as const;
const BOTH = ['web', 'phone'] as const;

export const SEEDED_BUGS: readonly SeededBug[] = [
  {
    id: 'cobrar-primer-clic',
    title: '«Cobrar» no responde al primer clic',
    scenario: PRIMERA_VENTA,
    expected_category: 'bug',
    expected_dedupe_prefix: 'caja/cobrar',
    runners: WEB,
    web: { page: { kind: 'first-click', button: 'Cobrar' } },
  },
  {
    id: 'etiqueta-tecnica',
    title: '«Cobrar» dice «Procesar transacción (POS)»',
    scenario: PRIMERA_VENTA,
    expected_category: 'comprehension',
    expected_dedupe_prefix: 'caja/cobrar',
    runners: WEB,
    web: { page: { kind: 'relabel', from: 'Cobrar', to: 'Procesar transacción (POS)' } },
  },
  {
    id: 'total-redondeo',
    title: 'El total del ticket sale un centavo abajo',
    scenario: PRIMERA_VENTA,
    expected_category: 'bug',
    expected_dedupe_prefix: 'caja/total',
    runners: WEB,
    web: { page: { kind: 'total-off', centavos: -1 } },
  },
  {
    id: 'guardar-500',
    title: 'Enviar la venta al servidor responde 500',
    scenario: PRIMERA_VENTA,
    expected_category: 'bug',
    expected_dedupe_prefix: 'sincronizacion/enviar',
    runners: BOTH,
    web: { net: PUSH_500 },
    phone: { scenario: 'primera-venta-telefono', net: PUSH_500 },
  },
  {
    id: 'error-en-ingles',
    title: 'El aviso de «sin permiso» sale en inglés',
    scenario: 'permisos-operador',
    expected_category: 'comprehension',
    expected_dedupe_prefix: 'ventas/cancelar-venta',
    runners: WEB,
    web: {
      page: {
        kind: 'translate',
        from: 'No tienes permiso para cancelar ventas',
        to: 'Permission denied (SIN_PERMISO)',
      },
    },
  },
  {
    id: 'siguiente-fuera-de-vista',
    title: '«Siguiente» queda fuera de la pantalla a 360 px',
    scenario: 'onboarding-camino-a',
    expected_category: 'bug',
    expected_dedupe_prefix: 'onboarding/siguiente',
    runners: WEB,
    web: { page: { kind: 'off-screen', button: 'Siguiente', maxWidth: 360 } },
  },
  {
    id: 'fuga-permiso-cancelar',
    title: 'Un operador sin permiso sí puede cancelar una venta',
    scenario: 'permisos-operador',
    expected_category: 'bug',
    expected_dedupe_prefix: 'ventas/cancelar-venta',
    runners: WEB,
    web: { net: PERMISOS },
  },
  {
    id: 'guardado-lento',
    title: 'Enviar la venta tarda 8 s sin que nada lo diga',
    scenario: PRIMERA_VENTA,
    expected_category: 'friction',
    expected_dedupe_prefix: 'sincronizacion/enviar',
    runners: BOTH,
    web: { net: PUSH_SLOW },
    phone: { scenario: 'primera-venta-telefono', net: PUSH_SLOW },
  },
];

export function seededBug(id: string): SeededBug {
  const bug = SEEDED_BUGS.find((b) => b.id === id);
  if (bug === undefined) {
    throw new Error(`no seeded bug «${id}» (known: ${SEEDED_BUGS.map((b) => b.id).join(', ')})`);
  }
  return bug;
}
