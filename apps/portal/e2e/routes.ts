/** Every product route the portal serves. `/inventario` is dev scaffolding. */
export const ROUTES: readonly { readonly path: string; readonly heading: string }[] = [
  { path: '/', heading: 'Hola, Pedro' },
  { path: '/asesor', heading: 'Asesor' },
  { path: '/movimientos', heading: 'Movimientos' },
  { path: '/estados', heading: 'Estados financieros' },
  { path: '/productos', heading: 'Productos' },
  { path: '/equipo', heading: 'Tu equipo' },
  { path: '/empleados', heading: 'Empleados' },
  { path: '/avisos', heading: 'Avisos' },
  { path: '/sincronizacion', heading: 'Sincronización' },
  { path: '/negocio', heading: 'Negocio' },
  { path: '/suscripcion', heading: 'Suscripción' },
];
