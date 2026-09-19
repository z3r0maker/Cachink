/**
 * Barrel for the Director Home screen (P1C-M10).
 *
 * Exports the composable shell + the smart route component that wires
 * every hook. Mobile and desktop both import `DirectorHomeRoute` from
 * here — the route component internally consumes the hooks that the
 * repository provider exposes.
 */
export { DirectorHomeScreen, type DirectorHomeScreenProps } from './director-home-screen';
export { DirectorHomeRoute, type DirectorHomeRouteProps } from './director-home-route';
export { UtilidadHero, type UtilidadHeroProps, currentMonthRange } from './utilidad-hero';
export { HoyKpiStrip, type HoyKpiStripProps, todayIso } from './hoy-kpi-strip';
export { CxCCard, type CxCCardProps } from './cxc-card';
export { ActividadReciente, type ActividadRecienteProps } from './actividad-reciente';
export { StockBajoCard, type StockBajoCardProps } from './stock-bajo-card';
export {
  PendientesDirectorCard,
  type PendientesDirectorCardProps,
} from './pendientes-director-card';
export {
  ConflictosRecientesCard,
  type ConflictosRecientesCardProps,
} from './conflictos-recientes-card';
