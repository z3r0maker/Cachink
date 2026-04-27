/**
 * Storybook catalog for `<BusinessForm>` — the wizard's "Tu negocio" step
 * (P1C-M2-T05).
 *
 * Exists primarily so the Playwright + Storybook visual-snapshot pipeline
 * catches layout regressions on every PR. The screenshot baseline must
 * show the form column centered on the viewport at 480 px max-width — if
 * a future change pushes it back to full-bleed (as the original code
 * did), this story's snapshot will fail.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { initI18n } from '../../i18n/index';
import { BusinessForm } from './business-form';

initI18n();

const meta: Meta<typeof BusinessForm> = {
  title: 'Phase 1C / Screens / BusinessForm',
  component: BusinessForm,
  tags: ['autodocs'],
  args: {
    onSubmit: () => undefined,
  },
};
export default meta;
type Story = StoryObj<typeof BusinessForm>;

/** Empty form — what the user sees on first entry to the wizard step. */
export const Empty: Story = {};

/** Pre-filled — what the screenshot showed: typical "Taquería Don Pedro" defaults. */
export const Prefilled: Story = {
  args: {
    defaults: { nombre: 'Taquería Don Pedro', regimenFiscal: 'RIF', isrTasa: 0.3 },
  },
};

/** Submitting state — disabled button, opacity 0.5. */
export const Submitting: Story = {
  args: {
    defaults: { nombre: 'Taquería Don Pedro', regimenFiscal: 'RIF', isrTasa: 0.3 },
    submitting: true,
  },
};

/**
 * With back affordance — what production renders inside `<BusinessGate />`.
 * The ghost "← Atrás" button sits below the primary submit and clears the
 * AppConfig mode on press, returning the user to the wizard.
 */
export const WithBackLink: Story = {
  args: {
    onBack: () => undefined,
  },
};
