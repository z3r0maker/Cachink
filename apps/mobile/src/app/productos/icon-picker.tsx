/**
 * Expo Router entry for /productos/icon-picker.
 *
 * Reads the selected icon from the zustand product form store and
 * navigates back on accept/cancel.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { IconPickerScreen, useProductFormStore } from '@cachink/ui';

export default function IconPickerRoute(): ReactElement {
  const router = useRouter();
  const updateIcon = useProductFormStore((s) => s.updateIcon);
  const currentIcon = useProductFormStore(
    (s) => s.draft?.icono ?? null,
  );

  return (
    <IconPickerScreen
      selectedIcon={currentIcon}
      onAccept={(icon) => {
        updateIcon(icon);
        router.back();
      }}
      onCancel={() => router.back()}
    />
  );
}
