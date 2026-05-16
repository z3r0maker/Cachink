/**
 * DesktopRouter — state-based path router for the Tauri app
 * (P1C-M10 S4-C1; Slice 9 wiring catch-up).
 *
 * Keeps a `currentPath` in useState; the `DesktopRouterContext` (in
 * `desktop-router-context.tsx`) exposes the navigate function that
 * children call in place of `router.push` on mobile. Each post-role
 * route adapter wraps itself in `DesktopAppShellWrapper` — mirrors
 * the mobile Expo Router / `AppShellWrapper` pattern. App-shell only
 * per CLAUDE.md §5.6.
 *
 * Path table kept in sync with `apps/mobile/src/app/`:
 *   /                    → DirectorHomeRoute (Director) / redirect to
 *                          /ventas (Operativo)
 *   /ventas              → VentasRoute
 *   /egresos             → EgresosRoute
 *   /productos           → ProductosRoute (renamed from /inventario, ADR-045)
 *   /inventario          → ProductosRoute (legacy redirect)
 *   /clientes            → ClientesRoute
 *   /cuentas-por-cobrar  → CuentasPorCobrarRoute
 *   /estados             → EstadosRoute
 *   /settings            → SettingsRoute
 *   /otros               → OtrosRoute
 *   /merma               → MermaRoute
 *   /funciones           → FuncionesRoute
 *   /usuarios            → UsuariosRoute
 *   /caja                → CajaRoute
 *   /conversion          → Placeholder
 *   /auditoria           → Placeholder
 *   /ventas-credito      → Placeholder
 *   /caja-reportes       → Placeholder
 *   /merma-reportes      → Placeholder
 *   /role-picker         → RolePicker (role-gate fallback)
 *   /wizard[...]         → Wizard (handled by GatedNavigation upstream)
 */

import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  AppShell,
  AuditoriaScreen,
  CajaReportesScreen,
  DirectorHomeRoute,
  MermaReportesScreen,
  RolePicker,
  VentasCreditoScreen,
  useCurrentBusiness,
  useFeatureFlags,
  useMode,
  useRole,
  useSetRole,
  type Role,
} from '@cachink/ui';
import { DesktopRouterContext } from './desktop-router-context';
import { VentasRoute } from './routes/ventas-route';
import { EgresosRoute } from './routes/egresos-route';
import { ProductosRoute } from './routes/productos-route';
import { ClientesRoute } from './routes/clientes-route';
import { CuentasPorCobrarRoute } from './routes/cuentas-por-cobrar-route';
import { EstadosRoute } from './routes/estados-route';
import { SettingsRoute } from './routes/settings-route';
import { OtrosRoute } from './routes/otros-route';
import { MermaRoute } from './routes/merma-route';
import { FuncionesRoute } from './routes/funciones-route';
import { UsuariosRoute } from './routes/usuarios-route';
import { EmpleadosRoute } from './routes/empleados-route';
import { CajaRoute } from './routes/caja-route';
import { ConversionRoute } from './routes/conversion-route';

function useDesktopNavigation(): {
  path: string;
  navigate: (next: string) => void;
} {
  const [path, setPath] = useState<string>('/');
  const navigate = useCallback((next: string) => setPath(next), []);
  return { path, navigate };
}

function DesktopRoleGate({
  role,
  onChangeRole,
}: {
  role: Role | null;
  onChangeRole: (role: Role) => void;
}): ReactElement | null {
  if (role !== null) return null;
  return <RolePicker onSelect={onChangeRole} />;
}

interface DirectorContext {
  readonly navigate: (path: string) => void;
  readonly setRole: (role: Role | null) => void;
  readonly title: string | undefined;
  readonly mode: ReturnType<typeof useMode>;
  readonly flags: ReturnType<typeof useFeatureFlags>;
}

/**
 * Director-home inline adapter — mirrors `apps/mobile/src/app/index.tsx`
 * (which also wraps DirectorHomeRoute in <AppShell> inline rather than
 * via the shell wrapper). Kept here instead of a dedicated file so the
 * 7-adapter count in Slice 9 stays accurate.
 */
function DirectorHomeDesktopRoute(ctx: DirectorContext): ReactElement {
  return (
    <AppShell
      role="director"
      activeTabKey="home"
      mode={ctx.mode}
      flags={ctx.flags}
      title={ctx.title}
      onNavigate={ctx.navigate}
      onChangeRole={() => {
        ctx.setRole(null);
        ctx.navigate('/role-picker');
      }}
      onOpenSettings={() => ctx.navigate('/settings')}
    >
      <DirectorHomeRoute onNavigate={ctx.navigate} />
    </AppShell>
  );
}

/**
 * Ordered prefix→element table. Longer prefixes MUST appear before shorter
 * ones (e.g. /ventas-credito before /ventas) to avoid accidental matches.
 * Evaluated top-to-bottom by `resolveRouteByPrefix`.
 */
const PREFIX_ROUTES: ReadonlyArray<{ prefix: string; element: ReactElement }> = [
  { prefix: '/ventas-credito', element: <VentasCreditoScreen /> },
  { prefix: '/ventas',         element: <VentasRoute /> },
  { prefix: '/egresos',        element: <EgresosRoute /> },
  { prefix: '/productos',      element: <ProductosRoute /> },
  { prefix: '/inventario',     element: <ProductosRoute /> },
  { prefix: '/clientes',       element: <ClientesRoute /> },
  { prefix: '/cuentas-por-cobrar', element: <CuentasPorCobrarRoute /> },
  { prefix: '/estados',        element: <EstadosRoute /> },
  { prefix: '/empleados',      element: <EmpleadosRoute /> },
  { prefix: '/settings',       element: <SettingsRoute /> },
  { prefix: '/otros',          element: <OtrosRoute /> },
  { prefix: '/funciones',      element: <FuncionesRoute /> },
  { prefix: '/usuarios',       element: <UsuariosRoute /> },
  { prefix: '/merma-reportes', element: <MermaReportesScreen /> },
  { prefix: '/merma',          element: <MermaRoute /> },
  { prefix: '/caja-reportes',  element: <CajaReportesScreen /> },
  { prefix: '/caja',           element: <CajaRoute /> },
  { prefix: '/conversion',     element: <ConversionRoute /> },
  { prefix: '/auditoria',      element: <AuditoriaScreen /> },
] as const;

function resolveRouteByPrefix(path: string): ReactElement | undefined {
  return PREFIX_ROUTES.find((r) => path.startsWith(r.prefix))?.element;
}

function renderRouteContent(path: string, role: Role, ctx: DirectorContext): ReactElement {
  if (role === 'director' && path === '/') {
    return <DirectorHomeDesktopRoute {...ctx} />;
  }
  const match = resolveRouteByPrefix(path);
  if (match !== undefined) return match;
  // Fallback: Director Home for director, Ventas for Operativo.
  return role === 'director' ? <DirectorHomeDesktopRoute {...ctx} /> : <VentasRoute />;
}

export function DesktopRouter(): ReactElement | null {
  const role = useRole();
  const setRole = useSetRole();
  const mode = useMode();
  const flags = useFeatureFlags();
  const business = useCurrentBusiness().data ?? null;
  const { path, navigate } = useDesktopNavigation();

  const ctxValue = useMemo(() => ({ path, navigate }), [path, navigate]);

  if (role === null) {
    return <DesktopRoleGate role={role} onChangeRole={setRole} />;
  }

  return (
    <DesktopRouterContext.Provider value={ctxValue}>
      {renderRouteContent(path, role, {
        navigate,
        setRole,
        title: business?.nombre ?? undefined,
        mode,
        flags,
      })}
    </DesktopRouterContext.Provider>
  );
}
