/**
 * es-MX translation namespace.
 *
 * Per CLAUDE.md §8.5 the project ships a single locale at launch (es-MX).
 * The shape below is the seed for Phase 1A — only strings the existing
 * primitives + role labels need today. New keys land incrementally as
 * Phase 1C screens are built.
 *
 * Keep this object `as const` — the inferred type powers strict t() lookup
 * in `../types.d.ts` so typos like t('action.save') (singular) become
 * compile errors instead of empty-string fallbacks at runtime.
 */
export const esMX = {
  roles: {
    operativo: 'Operativo',
    director: 'Director',
  },
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    new: 'Nuevo',
    edit: 'Editar',
    close: 'Cerrar',
  },
  common: {
    yes: 'Sí',
    no: 'No',
    loading: 'Cargando…',
    error: 'Algo salió mal',
  },
  rolePicker: {
    title: 'Hola',
    subtitle: '¿Con qué rol vas a trabajar hoy?',
    operativoHint: 'Captura ventas, egresos e inventario',
    directorHint: 'Resultados, indicadores y estados financieros',
  },
} as const;

export type EsMX = typeof esMX;
