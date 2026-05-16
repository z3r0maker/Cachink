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
import type { BusinessId, DeviceId, UserId, UserRole } from '@cachink/domain';
import type { AppConfigState, AppMode, Role } from './types';

interface AppConfigStore extends AppConfigState {
  setDeviceId: (id: DeviceId | null) => void;
  setMode: (mode: AppMode | null) => void;
  setCurrentBusinessId: (id: BusinessId | null) => void;
  setRole: (role: Role | null) => void;
  setNotificationsEnabled: (next: boolean) => void;
  setCrashReportingEnabled: (next: boolean | null) => void;
  setUserId: (id: UserId | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setMustChangePin: (must: boolean) => void;
  setDiscoveryShown: (shown: boolean) => void;
  setCachinkSoundEnabled: (next: boolean) => void;
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
  notificationsEnabled: true,
  crashReportingEnabled: null,
  userId: null,
  userRole: null,
  mustChangePin: false,
  discoveryShown: false,
  cachinkSoundEnabled: true,
};

export const useAppConfigStore = create<AppConfigStore>((set) => ({
  ...INITIAL_STATE,
  setDeviceId: (deviceId) => set({ deviceId }),
  setMode: (mode) => set({ mode }),
  setCurrentBusinessId: (currentBusinessId) => set({ currentBusinessId }),
  setRole: (role) => set({ role }),
  setHydrated: (hydrated) => set({ hydrated }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setCrashReportingEnabled: (crashReportingEnabled) => set({ crashReportingEnabled }),
  setUserId: (userId) => set({ userId }),
  setUserRole: (userRole) => set({ userRole }),
  setMustChangePin: (mustChangePin) => set({ mustChangePin }),
  setDiscoveryShown: (discoveryShown) => set({ discoveryShown }),
  setCachinkSoundEnabled: (cachinkSoundEnabled) => set({ cachinkSoundEnabled }),
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

export const useNotificationsEnabled = (): boolean =>
  useAppConfigStore((s) => s.notificationsEnabled);

export const useSetNotificationsEnabled = (): ((next: boolean) => void) =>
  useAppConfigStore((s) => s.setNotificationsEnabled);

export const useCrashReportingEnabled = (): boolean | null =>
  useAppConfigStore((s) => s.crashReportingEnabled);

export const useSetCrashReportingEnabled = (): ((next: boolean | null) => void) =>
  useAppConfigStore((s) => s.setCrashReportingEnabled);

// --- User auth selectors ---

/** Selector: currently authenticated user ID (null = not logged in). */
export const useUserId = (): UserId | null => useAppConfigStore((s) => s.userId);

/** Setter: update the current user ID (login/logout). */
export const useSetUserId = (): ((id: UserId | null) => void) =>
  useAppConfigStore((s) => s.setUserId);

/** Selector: role from the authenticated User record. */
export const useUserRole = (): UserRole | null => useAppConfigStore((s) => s.userRole);

/** Setter: update user role (set on login from User.role). */
export const useSetUserRole = (): ((role: UserRole | null) => void) =>
  useAppConfigStore((s) => s.setUserRole);

/** Selector: whether the current user must change PIN. */
export const useMustChangePin = (): boolean => useAppConfigStore((s) => s.mustChangePin);

/** Setter: update mustChangePin flag. */
export const useSetMustChangePin = (): ((must: boolean) => void) =>
  useAppConfigStore((s) => s.setMustChangePin);

// --- Feature discovery selectors ---

/** Selector: whether the feature-discovery screen has been shown. */
export const useDiscoveryShown = (): boolean => useAppConfigStore((s) => s.discoveryShown);

/** Setter: mark feature-discovery as shown. */
export const useSetDiscoveryShown = (): ((shown: boolean) => void) =>
  useAppConfigStore((s) => s.setDiscoveryShown);

// --- Cachink sound selectors ---

/** Selector: whether the "¡CACHINK!" sound plays on each sale. */
export const useCachinkSoundEnabled = (): boolean =>
  useAppConfigStore((s) => s.cachinkSoundEnabled);

/** Setter: toggle the "¡CACHINK!" sale sound on/off. */
export const useSetCachinkSoundEnabled = (): ((next: boolean) => void) =>
  useAppConfigStore((s) => s.setCachinkSoundEnabled);
