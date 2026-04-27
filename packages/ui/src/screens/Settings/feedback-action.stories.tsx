/**
 * Storybook catalog for the `<FeedbackAction>` Settings card
 * (Slice 8 M3-C14).
 *
 * Two stories cover the visible permutations: the "no consent / no
 * breadcrumbs" baseline and the "consent + breadcrumbs" variant. The
 * card's UI surface is the same in both — the difference is purely
 * what the mailto: body contains. Stories use a no-op `openLink` so
 * pressing the button in Storybook doesn't try to open the OS mail
 * client.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { initI18n } from '../../i18n/index';
import { FeedbackAction } from './feedback-action';

initI18n();

const meta: Meta<typeof FeedbackAction> = {
  title: 'Phase 1F / Settings / Feedback Action',
  component: FeedbackAction,
  args: {
    appVersion: '1.0.0',
    platform: 'desktop-mac',
    role: 'Director',
    crashReportingEnabled: false,
    breadcrumbs: [],
    openLink: () => undefined,
  },
};
export default meta;

type Story = StoryObj<typeof FeedbackAction>;

export const Default: Story = {};

export const WithRoleAndConsent: Story = {
  args: {
    role: 'Operativo',
    crashReportingEnabled: true,
    breadcrumbs: [
      { message: 'opened sales screen', timestamp: '2026-04-25T10:00:00Z' },
      { message: 'created venta 01HX0000001', timestamp: '2026-04-25T10:01:00Z' },
    ],
  },
};
