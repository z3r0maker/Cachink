/**
 * Storybook catalog for the `<LanJoinScreen>` (Slice 8 M3-C14).
 *
 * Covers both platform variants: with-scanner (mobile) shows the
 * "Escanear QR" CTA; without-scanner (desktop) shows only the
 * paste-URL fallback. The tests exercise the same screen via stubbed
 * pair / onPaired functions; this catalog gives designers a visual
 * reference.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { initI18n } from '../../i18n/index';
import { LanJoinScreen, type LanPairSuccess } from './lan-join-screen';

initI18n();

const STUB_SUCCESS: LanPairSuccess = {
  serverUrl: 'http://192.168.1.5:43812',
  accessToken: 'real-token-abc',
  businessId: '01HX9999999999999999999999',
};

const meta: Meta<typeof LanJoinScreen> = {
  title: 'Phase 1D / Screens / Lan Join',
  component: LanJoinScreen,
  parameters: { layout: 'fullscreen' },
  args: {
    deviceId: 'DEV-DEMO-001',
    onPaired: () => undefined,
    pair: () => Promise.resolve(STUB_SUCCESS),
  },
};
export default meta;

type Story = StoryObj<typeof LanJoinScreen>;

/** Desktop variant: paste-URL only (no scanner is provided). */
export const PasteOnly: Story = {};

/** Mobile variant: scanner CTA visible alongside the paste fallback. */
export const WithScanner: Story = {
  args: {
    onOpenScanner: () => Promise.resolve(null),
  },
};

/** Pair() rejects — surfaces the inline error tag. */
export const ErrorState: Story = {
  args: {
    pair: () => Promise.reject(new Error('No autorizado · token inválido')),
  },
};
