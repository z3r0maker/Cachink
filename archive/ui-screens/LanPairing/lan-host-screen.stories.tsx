/**
 * Storybook catalog for the `<LanHostScreen>` (Slice 8 M3-C14).
 *
 * Covers the three render branches: starting (server bootstrapping),
 * ready (QR + URL + token + CTA), and error (server failed to bind).
 * Each story injects a stub `startServer` so the screen renders the
 * appropriate state without invoking real Tauri commands.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { initI18n } from '../../i18n/index';
import { LanHostScreen, type LanHostStartResult } from './lan-host-screen';

initI18n();

const READY: LanHostStartResult = {
  url: 'http://192.168.1.5:43812',
  pairingToken: 'pair-token-abc123',
  // 1×1 transparent PNG — keeps the snapshot byte-stable.
  qrPngBase64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
};

const meta: Meta<typeof LanHostScreen> = {
  title: 'Phase 1D / Screens / Lan Host',
  component: LanHostScreen,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof LanHostScreen>;

export const Starting: Story = {
  args: {
    // Promise that never resolves — keeps the screen in the starting state.
    startServer: () => new Promise<LanHostStartResult>(() => {}),
    onContinue: () => undefined,
  },
};

export const Ready: Story = {
  args: {
    startServer: () => Promise.resolve(READY),
    onContinue: () => undefined,
  },
};

export const ErrorState: Story = {
  args: {
    startServer: () => Promise.reject(new Error('Permiso denegado: el puerto 43812 está en uso')),
    onContinue: () => undefined,
  },
};
