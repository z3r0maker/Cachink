/**
 * QrVisor — the camera that reads the portal's pairing QR, inline on
 * MvVincular (not the product scanner's modal). This file is the contract
 * and the stand-in Vite, Storybook and Vitest resolve: the frame with no
 * camera behind it. Metro picks `./qr-visor.native.tsx`, which puts
 * `expo-camera`'s `CameraView` inside the same frame (ADR-022's split).
 */
import type { ReactElement } from 'react';
import { useTranslation } from '../../i18n/index';
import { VisorMarco } from './qr-visor-marco';

export interface QrVisorProps {
  /** A pairing token read from the portal's QR (`tokenDeQr`). */
  readonly onToken: (token: string) => void;
  /** False while the confirm sheet is up: the camera stops reading. */
  readonly activo: boolean;
}

export function QrVisor(_props: QrVisorProps): ReactElement {
  const { t } = useTranslation();
  return (
    <VisorMarco
      etiqueta={t('entrar.vincular.visorCamara')}
      pista={t('entrar.vincular.visorHint')}
      mira
    >
      {null}
    </VisorMarco>
  );
}
