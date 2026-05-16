/**
 * Desktop route adapter for /productos/icon-picker.
 *
 * Same pattern as mobile: reads from zustand store, navigates back on
 * accept/cancel.
 */

import type { ReactElement } from 'react';
import { IconPickerScreen, useProductFormStore } from '@cachink/ui';
import { useDesktopNavigate } from '../desktop-router-context';

export function IconPickerRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const updateIcon = useProductFormStore((s) => s.updateIcon);
  const currentIcon = useProductFormStore(
    (s) => s.draft?.icono ?? null,
  );

  const goBack = (): void => navigate('/productos');

  return (
    <IconPickerScreen
      selectedIcon={currentIcon}
      onAccept={(icon) => {
        updateIcon(icon);
        goBack();
      }}
      onCancel={goBack}
    />
  );
}
