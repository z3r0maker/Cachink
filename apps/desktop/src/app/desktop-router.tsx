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
 *   /role-picker         → RolePicker (role-gate fallback)
 *   /wizard[...]         → Wizard (handled by GatedNavigation upstream)
 */

import { useCallback, useMemo, useState, type ReactElement } from 'react';
import {
  AppShell,
  DirectorHomeRoute,
  RolePicker,
  useCurrentBusiness,
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

function renderRouteContent(path: string, role: Role, ctx: DirectorContext): ReactElement {
  if (role === 'director' && path === '/') {
    return <DirectorHomeDesktopRoute {...ctx} />;
  }
  if (path.startsWith('/ventas')) return <VentasRoute />;
  if (path.startsWith('/egresos')) return <EgresosRoute />;
  if (path.startsWith('/productos')) return <ProductosRoute />;
  if (path.startsWith('/inventario')) return <ProductosRoute />; // Legacy redirect
  if (path.startsWith('/clientes')) return <ClientesRoute />;
  if (path.startsWith('/cuentas-por-cobrar')) return <CuentasPorCobrarRoute />;
  if (path.startsWith('/estados')) return <EstadosRoute />;
  if (path.startsWith('/settings')) return <SettingsRoute />;

  // Fallback: Director Home for director, Ventas for Operativo. Matches
  // mobile's redirect-to-/ventas behaviour for Operativo.
  if (role === 'director') return <DirectorHomeDesktopRoute {...ctx} />;
  return <VentasRoute />;
}

export function DesktopRouter(): ReactElement | null {
  const role = useRole();
  const setRole = useSetRole();
  const mode = useMode();
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
      })}
    </DesktopRouterContext.Provider>
  );
}
