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
 *
 * This file intentionally holds all keys in a single object so the
 * compile-time `EsMX = typeof esMX` type remains a single source of
 * truth for `react-i18next`'s strict typing. It's a pure data file;
 * the 200-line ceiling is waived for locales only.
 */
/* eslint-disable max-lines */
import { entrar } from './es-mx-entrar';

export const esMX = {
  entrar,
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    new: 'Nuevo',
  },
  common: {
    yes: 'Sí',
    no: 'No',
    loading: 'Cargando…',
  },
  forms: {
    combobox: {
      searchPlaceholder: 'Buscar...',
      searchAriaLabel: 'Buscar opciones',
    },
    exactAmount: {
      label: 'Exacto',
      ariaLabel: 'Importe exacto',
    },
  },
  database: {
    errorState: {
      title: 'No se pudo abrir la base de datos',
      body: 'Vuelve a intentarlo. Si el problema continúa, copia el detalle o restablece la base local.',
      retry: 'Reintentar',
      copy: 'Copiar detalle',
      copied: 'Detalle copiado',
      reset: 'Restablecer base local',
      resetConfirmTitle: '¿Restablecer la base local?',
      resetConfirmBody:
        'Esto borra la base local dañada y vuelve a crearla desde cero en este dispositivo.',
      resetConfirmAction: 'Sí, restablecer',
    },
  },
  cancelaciones: {
    cancelSale: 'Cancelar',
    cancelSaleAriaLabel: 'Cancelar venta',
  },
  productos: {
    backAriaLabel: 'Volver',
    editInPortal: 'Este producto se edita o elimina desde la cuenta del negocio, no desde la app.',
  },
  inventario: {
    title: 'Inventario',
    stockTab: 'Stock',
    movimientosTab: 'Movimientos',
    buscar: 'Buscar',
    buscarPlaceholder: 'Nombre o SKU',
    emptyTitle: 'Aún no hay productos',
    emptyBody: 'Registra tu primer producto con el botón de abajo.',
    newCta: '+ Nuevo Producto',
    entrada: 'Entrada',
    salida: 'Salida',
    bajoStockTitle: 'Stock bajo',
    movimientoEmptyTitle: 'Sin movimientos recientes',
    movimientoEmptyBody:
      'Selecciona un producto en la pestaña Stock para registrar una entrada o salida.',
  },
  nuevoProducto: {
    title: 'Nuevo producto',
    nombreLabel: 'Nombre',
    nombrePlaceholder: 'Tortilla',
    skuLabel: 'SKU',
    skuPlaceholder: 'Opcional',
    categoriaLabel: 'Categoría',
    precioVentaLabel: 'Precio de venta',
    save: 'Guardar',
    conStock: 'Llevar inventario',
    conStockHint: 'Descuenta existencias con cada venta.',
    sinStock: 'Sin inventario',
    sinStockHint: 'Servicios o productos que no se cuentan.',
    portalHint: 'Costo, unidad, alerta de stock e ícono se ajustan desde la cuenta del negocio.',
  },
  movimiento: {
    titleEntrada: 'Registrar entrada',
    titleSalida: 'Registrar salida',
    cantidadLabel: 'Cantidad',
    cantidadInvalid: 'Mayor a 0',
    costoUnitLabel: 'Costo por unidad',
    motivoLabel: 'Motivo',
    notaLabel: 'Nota',
    notaOpcional: 'Opcional',
    save: 'Registrar',
  },
  scanner: {
    refocusAriaLabel: 'Tocar para enfocar la cámara',
    title: 'Escanear código',
    close: 'Cerrar',
    permissionDenied: 'Permiso de cámara denegado',
    notSupported: 'El escáner no está disponible en este dispositivo',
    manualEntry: 'Ingresar código manualmente',
    manualLabel: 'Código',
  },
  ventas: {
    // Products Gate
    productosGateTitle: 'Registra tus productos para empezar a vender',
    productosGateDescription:
      'Aún no tienes productos. Agrega al menos uno para poder registrar ventas.',
    productosGateCta: 'Ir a Productos',
  },
  settings: {
    cuenta: 'Esta caja',
    negocio: 'Negocio',
    dispositivo: 'Caja',
    portalHint: 'Operadores y productos se administran desde la cuenta del negocio.',
    unlink: 'Desvincular esta caja',
    unlinkConfirmTitle: '¿Desvincular esta caja?',
    unlinkConfirmBody: 'Elige qué pasa con lo que está guardado en este teléfono.',
    unlinkConfirm: 'Desvincular',
    unlinkSolo: 'Solo desvincular',
    unlinkSoloDetalle:
      'Los registros se quedan en este teléfono. Si la vuelves a conectar, se envía lo pendiente.',
    unlinkBorrar: 'Desvincular y borrar',
    unlinkBorrarDetalle:
      'Se borran de este teléfono las ventas, los gastos, los turnos, el catálogo y los NIP. En el portal no se borra nada.',
    unlinkTodoEnviado: 'Todo está enviado al portal. No se pierde nada.',
    unlinkSinEnviar:
      'Registros sin enviar: {{count}}. Si borras ahora, se pierden: envíalos primero.',
    unlinkEnviarAhora: 'Enviar ahora',
    unlinkEnviando: 'Enviando…',
    unlinkVerNoEnviados: 'Ver no enviados',
    unlinkCancelar: 'Cancelar',
    unlinkBorrandoTitulo: 'Borrando los datos de esta caja',
    unlinkBorrandoCuerpo: 'Tarda unos segundos. No cierres la app.',
    unlinkBorrarFallo: 'No se pudieron borrar los datos. Intenta de nuevo.',
    sincronizacion: 'Sincronización',
    estado: 'Estado',
    noEnviados: 'Ver {{count}} no enviados',
    dispositivoSection: 'En este teléfono',
    privacidadSection: 'Privacidad y términos',
    avisoPrivacidad: 'Aviso de privacidad',
    avisoPrivacidadDetalle: 'Qué datos guarda la caja y tus derechos ARCO',
    terminos: 'Términos y condiciones',
    terminosDetalle: 'Las reglas del servicio de Xangarro',
    privacidadNota: 'Se abren en tu navegador.',
    hubTitle: 'Ajustes',
    notificacionesLabel: 'Notificaciones',
    notificacionesHint: 'Recibir avisos de stock bajo al final del día',
    crashReportingTitle: '¿Enviar reportes de errores?',
    crashReportingBody:
      'Envía datos de diagnóstico a Sentry y a la base de datos de errores de Xangarro para detectar fallos más rápido. Nunca enviamos conceptos, nombres o notas.',
    crashReportingYes: 'Sí, enviar',
    crashReportingNo: 'No, gracias',
    crashReportingLater: 'Decidir después',
    crashReportingToggleLabel: 'Reportes de errores',
    crashReportingToggleHint:
      'Envía datos de diagnóstico y errores para mejorar la app. Nunca se envían conceptos, nombres ni notas.',
    reportBugCta: 'Reportar un problema',
    checkForUpdatesCta: 'Buscar actualizaciones',
  },
  notifications: {
    stockLowTitle: 'Stock bajo',
    stockLowBodyOne:
      'Un producto está por agotarse. Registra la entrada cuando llegue o avísale al dueño.',
    stockLowBodyMany:
      '{{count}} productos están por agotarse. Registra las entradas cuando lleguen o avísale al dueño.',
  },
  notificaciones: {
    // Alert source titles
    stockBajo: 'Stock bajo',
    cajaDiscrepancia: 'Discrepancia en caja',
    cajaEgresoAuto: 'Egreso automático',
    mermaThreshold: 'Merma elevada',
    gastoRecurrentePendiente: 'Gasto recurrente confirmado',
  },
  errors: {
    dismissToastAriaLabel: 'Descartar aviso: {{message}}',
  },
  errorBoundary: {
    title: 'Algo salió mal',
    body: 'Un error inesperado detuvo la aplicación.',
    reset: 'Volver al inicio',
    copy: 'Copiar detalles',
    copied: 'Copiado',
  },
  validation: {
    required: 'Campo requerido',
    greaterThanZero: 'Debe ser mayor a $0',
  },
  // Phase 1 — User Management + Auth
  login: {
    noOperatorsTitle: 'Aún no hay operadores',
    noOperatorsBody: 'Pide al dueño del negocio que cree un operador y luego toca Actualizar.',
    refresh: 'Actualizar',
  },
  sync: {
    errors: {
      protocol: 'Actualiza la app para seguir sincronizando.',
      unauthenticated: 'Este dispositivo necesita vincularse de nuevo.',
      deviceRevoked: 'Este dispositivo fue desvinculado desde el portal.',
      rateLimited: 'El servidor está ocupado. Se reintentará solo.',
      internal: 'Falla temporal del servidor. Se reintentará solo.',
      validation: 'El registro tiene datos que el servidor no acepta.',
      businessMismatch: 'El registro pertenece a otro negocio.',
      tableNotWritable: 'Este tipo de registro solo se cambia en el portal.',
      hybridUpdate: 'Los cambios a este registro se hacen en el portal.',
      fkProduct: 'El producto de este registro ya no existe en el portal.',
      fkUser: 'El operador de este registro ya no existe en el portal.',
      fkClient: 'El cliente de este registro ya no existe en el portal.',
      duplicate: 'El servidor ya tiene un registro distinto con este mismo identificador.',
    },
  },
  noEnviados: {
    intro: 'Estos registros siguen guardados en este dispositivo, pero el servidor no los aceptó.',
    empty: 'Todo se envió. No hay registros pendientes de revisar.',
    retry: 'Reintentar',
    retrying: 'Reintentando automáticamente',
    kinds: {
      venta: 'Venta',
      egreso: 'Egreso',
      movimiento: 'Movimiento de inventario',
      turno: 'Turno de caja',
      movimientoCaja: 'Movimiento de caja',
      cancelacion: 'Cancelación',
      corte: 'Corte de día',
      producto: 'Producto',
      cliente: 'Cliente',
      pago: 'Pago de cliente',
      otro: 'Registro',
    },
    hints: {
      // Never «regístrala» again: the row is still here, it would count twice (R5).
      productMissing:
        'Pídele al dueño que recupere el producto en el portal y toca Reintentar. No la vuelvas a capturar: se contaría dos veces.',
      clientMissing:
        'Pídele al dueño que recupere el cliente en el portal y toca Reintentar. No la vuelvas a capturar: se contaría dos veces.',
      userMissing: 'El operador fue eliminado en el portal.',
    },
  },
  planLimit: {
    title: 'Llegaste a {{limit}} registros este mes',
    body: 'Tu negocio ya usó los registros incluidos este mes.',
    where: 'Pide al dueño del negocio que revise su cuenta. Lo que ya registraste sigue guardado.',
    ok: 'Entendido',
  },
  planBanner: {
    grace: 'Tu pago está pendiente — tienes hasta el {{date}}.',
    fellBack: 'La cuenta de tu negocio necesita atención. Pide al dueño del negocio que la revise.',
  },
  // The header's pill says it the caja's way (the web caja's header):
  // «Enviado» or «N sin enviar». Accessible names carry the long form.
  syncPill: {
    syncing: 'Enviando…',
    rejected: '{{count}} no enviados',
    offline: '{{count}} sin enviar',
    pending: '{{count}} sin enviar',
    synced: 'Enviado',
    never: 'Sin enviar',
    sinInternet: 'Sin internet',
    tapToUpdate: 'Toca para enviar ahora',
    openPendientes: 'Toca para ver lo que falta enviar',
    openRejected: 'Toca para ver los no enviados',
    update: 'Actualizar',
  },
  // The caja's frame (Track M, M-05): tabs, rail, sidebar, header, overlays.
  shell: {
    nav: {
      inicio: 'Inicio',
      cobrar: 'Cobrar',
      ventas: 'Ventas',
      gastos: 'Gastos',
      turno: 'Mi turno',
      inventario: 'Inventario',
      fiado: 'Fiado y abonos',
      avisos: 'Avisos',
      dinero: 'Dinero del turno',
      menu: 'Menú de la caja',
    },
    turno: {
      rows: 'Lo de tu turno',
      gastos: 'Gastos',
      gastosDetalle: 'Lo que sale de la caja',
      fiado: 'Fiado y abonos',
      fiadoDetalle: 'Lo que se llevaron fiado y lo que abonaron',
      inventario: 'Inventario',
      inventarioDetalle: 'Productos, existencias y lo que llegó',
      movimientos: 'Movimientos de caja',
      movimientosDetalle: 'Depósitos y retiros de hoy',
      avisos: 'Avisos',
      avisosDetalle: 'Los mensajes de tu caja',
      pendientes: 'Registros por enviar',
      pendientesDetalle: 'Lo que se captura sin internet',
      ajustes: 'Ajustes de la caja',
      ajustesDetalle: 'Esta caja, avisos y privacidad',
      bloquear: 'Bloquear la caja',
      cerrar: 'Cerrar',
      cerrarTurno: 'Cerrar mi turno',
      cerrarTurnoCorto: 'Cerrar turno',
      abierto: 'Cobrando desde las {{hora}}',
      sinTurno: 'Sin turno abierto',
    },
    cajaSinNombre: 'La caja',
    avisos: 'Avisos, {{count}} sin leer',
    volver: 'Volver',
    cerrar: 'Cerrar',
    cerrarAviso: 'Cerrar aviso: {{title}}',
    offline: {
      title: 'Sin internet',
      body: 'Sigue cobrando. Todo se guarda en esta caja y se envía solo.',
      bodyCount: 'Sigue cobrando. {{count}} por enviar; se envían solos al volver.',
    },
    bloqueo: {
      title: 'Caja bloqueada',
    },
  },
  activate: {
    errors: {
      codeInvalid: 'El correo o el código no coinciden. Revísalos e intenta de nuevo.',
      codeExpired: 'Ese código ya venció. Pide uno nuevo al dueño del negocio.',
      codeUsed: 'Ese código ya se usó en otro dispositivo. Genera uno nuevo.',
      noSlots:
        'Este negocio ya no tiene lugar para otro dispositivo. Pide al dueño del negocio que revise su cuenta.',
      suspended: 'La cuenta de este negocio está suspendida.',
      network: 'No hay conexión. Revisa tu internet e intenta de nuevo.',
      config:
        'Esta versión de la app no quedó lista para conectarse. Actualiza la app e intenta de nuevo.',
      unknown: 'Algo salió mal. Intenta de nuevo en un momento.',
    },
  },
  dev: {
    resetTitle: 'Borrar datos demo',
    resetBtn: 'Borrar todo y reiniciar',
    resetHint: 'Elimina la base de datos y reinicia la app desde cero. Requiere tu PIN.',
    resetPinTitle: 'Verificar identidad',
    resetPinPrompt: 'Ingresa tu PIN para autorizar el borrado',
    resetPinError: 'PIN incorrecto',
    resetConfirmTitle: '¿Borrar todos los datos?',
    resetConfirmBody:
      'Se eliminará la base de datos completa. La app se reiniciará en el asistente de configuración. Esta acción NO se puede deshacer.',
    resetConfirmBtn: 'Sí, borrar todo',
    resetError: 'Error al borrar la base de datos.',
  },
} as const;

export type EsMX = typeof esMX;
