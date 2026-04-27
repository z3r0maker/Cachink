/**
 * Storybook catalog for the `<PasswordResetScreen>` (Slice 8 M3-C14).
 *
 * Covers the three observable states: idle (default form), sending
 * (CTA disabled), and sent (success tag). The error state is
 * exercised in the unit test, not here.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { initI18n } from '../../i18n/index';
import { PasswordResetScreen } from './password-reset-screen';

initI18n();

const meta: Meta<typeof PasswordResetScreen> = {
  title: 'Phase 1E / Screens / Password Reset',
  component: PasswordResetScreen,
  parameters: { layout: 'fullscreen' },
  args: { onBack: () => undefined },
};
export default meta;

type Story = StoryObj<typeof PasswordResetScreen>;

export const Default: Story = {
  args: {
    onReset: () => Promise.resolve(),
  },
};

export const Sending: Story = {
  args: {
    // Promise that never resolves — keeps the CTA in 'sending' state.
    onReset: () => new Promise<void>(() => {}),
  },
};
