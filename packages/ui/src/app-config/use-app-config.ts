/**
 * `useAppConfigStore` — Zustand store that tracks the four pieces of
 * shell-level state the UI consumes: deviceId, mode, currentBusinessId,
 * and role.
 *
 * Writes from hooks (`setMode`, `setCurrentBusinessId`, `setRole`,
 * `setDeviceId`, `resetMode`) only update the store. Persistence is the
 * provider's job (see {@link AppConfigProvider}) — hooks that also need
 * to write through to the AppConfigRepository use
 * {@link useRepositories}'s `appConfig` repository and then update the
 * store. This split lets tests exercise the store without touching a db.
 */

import { create } from 'zustand';
import type { BusinessId, DeviceId } from '@cachink/domain';
import type { AppConfigState, AppMode, Role } from './types';

interface AppConfigStore extends AppConfigState {
  setDeviceId: (id: DeviceId | null) => void;
  setMode: (mode: AppMode | null) => void;
  setCurrentBusinessId: (id: BusinessId | null) => void;
  setRole: (role: Role | null) => void;
  /** Full reset — used by tests and by the "re-run wizard" settings action. */
  reset: () => void;
  /** Hydration complete marker — flips once the provider finishes loading. */
  setHydrated: (value: boolean) => void;
}

const INITIAL_STATE: AppConfigState = {
  deviceId: null,
  mode: null,
  currentBusinessId: null,
  role: null,
  hydrated: false,
};

export const useAppConfigStore = create<AppConfigStore>((set) => ({
  ...INITIAL_STATE,
  setDeviceId: (deviceId) => set({ deviceId }),
  setMode: (mode) => set({ mode }),
  setCurrentBusinessId: (currentBusinessId) => set({ currentBusinessId }),
  setRole: (role) => set({ role }),
  setHydrated: (hydrated) => set({ hydrated }),
  reset: () => set(INITIAL_STATE),
}));

/** Selector: the current deviceId (null before hydration). */
export const useDeviceId = (): DeviceId | null => useAppConfigStore((s) => s.deviceId);

/** Selector: the active deployment mode (null means the wizard hasn't run). */
export const useMode = (): AppMode | null => useAppConfigStore((s) => s.mode);

/** Selector: the active business (null means the wizard hasn't created one). */
export const useCurrentBusinessId = (): BusinessId | null =>
  useAppConfigStore((s) => s.currentBusinessId);

/** Selector: the active session role (null means role picker hasn't been used). */
export const useRole = (): Role | null => useAppConfigStore((s) => s.role);

/** Selector: whether the provider has finished hydrating from disk. */
export const useAppConfigHydrated = (): boolean => useAppConfigStore((s) => s.hydrated);

/** Selector set used by the wizard gate and settings screens. */
export const useSetMode = (): ((mode: AppMode | null) => void) =>
  useAppConfigStore((s) => s.setMode);

export const useSetCurrentBusinessId = (): ((id: BusinessId | null) => void) =>
  useAppConfigStore((s) => s.setCurrentBusinessId);

export const useSetRole = (): ((role: Role | null) => void) => useAppConfigStore((s) => s.setRole);
