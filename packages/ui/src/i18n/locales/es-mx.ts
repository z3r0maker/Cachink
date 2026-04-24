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
  tabs: {
    ventas: 'Ventas',
    egresos: 'Egresos',
    inventario: 'Inventario',
    home: 'Inicio',
    estados: 'Estados',
    ajustes: 'Ajustes',
  },
  topBar: {
    cambiarRol: 'Cambiar',
    ajustes: 'Ajustes',
    syncLocal: 'Solo este dispositivo',
    syncLan: 'Sincronizado',
    syncCloud: 'En la nube',
    syncOffline: 'Sin conexión',
  },
  ventas: {
    title: 'Ventas',
    totalDelDia: 'Total del día',
    fechaLabel: 'Fecha',
    emptyTitle: 'Aún no hay ventas',
    emptyBody: 'Registra tu primera venta del día con el botón de abajo.',
    newCta: '+ Nueva Venta',
    noCliente: 'Sin cliente',
    delete: 'Eliminar',
    share: 'Compartir comprobante',
    retryLabel: 'Reintentar',
    errorTitle: 'No se pudieron cargar las ventas',
    errorBody: 'Revisa la conexión local y vuelve a intentarlo.',
  },
  nuevaVenta: {
    title: 'Nueva venta',
    conceptoLabel: 'Concepto',
    conceptoPlaceholder: 'Taco al pastor',
    categoriaLabel: 'Categoría',
    montoLabel: 'Monto',
    metodoLabel: 'Método de pago',
    clienteLabel: 'Cliente',
    clienteOpcional: 'Opcional',
    clienteRequired: 'Crédito requiere un cliente',
    save: 'Registrar venta',
    crearCliente: 'Crear cliente',
    sinClientes: 'No hay clientes. Crea uno primero.',
  },
  clientes: {
    title: 'Clientes',
    nuevo: 'Nuevo cliente',
    nombreLabel: 'Nombre',
    telefonoLabel: 'Teléfono',
    emailLabel: 'Correo',
    notaLabel: 'Nota',
    save: 'Guardar',
    emailInvalid: 'Correo no válido',
    required: 'Requerido',
  },
  comprobante: {
    title: 'Comprobante',
    gracias: '¡Gracias por su compra!',
    fecha: 'Fecha',
    metodo: 'Método',
    share: 'Compartir',
    cerrar: 'Cerrar',
  },
  cuentasPorCobrar: {
    title: 'Cuentas por cobrar',
    empty: 'Sin saldos pendientes.',
  },
  wizard: {
    title: 'Configura Cachink!',
    subtitle: '¿Cómo vas a trabajar?',
    comingSoon: 'Próximamente',
    localStandalone: {
      title: 'Solo este dispositivo',
      hint: 'Cachink corre en esta tableta. No necesita internet.',
    },
    cloud: {
      title: 'En la nube',
      hint: 'Sincroniza con otros dispositivos por internet.',
    },
    lanClient: {
      title: 'Conectar a un servidor local',
      hint: 'Une esta tableta a un servidor en la misma Wi-Fi.',
    },
    lanHost: {
      title: 'Ser el servidor local',
      hint: 'Esta computadora hospeda hasta 3 tabletas por Wi-Fi.',
    },
    businessForm: {
      title: 'Tu negocio',
      subtitle: 'Solo los datos indispensables.',
      nombreLabel: 'Nombre del negocio',
      nombrePlaceholder: 'Taquería Don Pedro',
      regimenLabel: 'Régimen fiscal',
      isrLabel: 'Tasa de ISR',
      isrHint: 'Puedes ajustar este valor con tu contador más adelante.',
      saveLabel: 'Guardar y continuar',
      required: 'Requerido',
    },
  },
  settings: {
    title: 'Ajustes',
    modoLabel: 'Modo',
    modoLocal: 'Solo este dispositivo',
    modoTabletOnly: 'Solo tablet',
    modoLan: 'Servidor local',
    modoCloud: 'En la nube',
    negocioLabel: 'Negocio',
    negocioNoConfigurado: 'Sin configurar',
    regimenLabel: 'Régimen fiscal',
    isrLabel: 'ISR',
    idiomaLabel: 'Idioma',
    idiomaValue: 'Español (es-MX)',
    reRunWizard: 'Re-ejecutar asistente',
    reRunWizardHint: 'Volver al asistente de configuración',
  },
} as const;

export type EsMX = typeof esMX;
