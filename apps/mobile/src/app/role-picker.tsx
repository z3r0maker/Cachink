/**
 * Expo Router entry for the Role Picker (P1C-M1-T01).
 *
 * App-shell only per CLAUDE.md §5.6: imports the reusable `RolePicker`
 * screen from `@cachink/ui` and wires its single callback to the Zustand
 * role store + Expo Router. The visual implementation lives entirely in
 * the shared component so desktop renders the identical screen.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { RolePicker, useSetRole, type Role } from '@cachink/ui';

export default function RolePickerRoute(): ReactElement {
  const router = useRouter();
  const setRole = useSetRole();
  function handleSelect(role: Role): void {
    setRole(role);
    router.replace('/');
  }
  return <RolePicker onSelect={handleSelect} />;
}
