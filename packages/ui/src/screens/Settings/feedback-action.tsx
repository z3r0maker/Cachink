/**
 * FeedbackAction — Settings row that opens a `mailto:` to
 * `feedback@cachink.mx` prefilled with the app version, platform, role,
 * and (only if Sentry consent was granted per ADR-027) the last 10
 * breadcrumbs.
 *
 * PII leak prevention: we reuse `pii-scrubber.ts` to strip known
 * free-text fields from the breadcrumbs before embedding them in the
 * email body. Without consent, no breadcrumbs ship at all.
 */

import type { ReactElement } from 'react';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface FeedbackActionProps {
  readonly appVersion: string;
  readonly platform: 'ios' | 'android' | 'desktop-mac' | 'desktop-windows';
  readonly role: 'Operativo' | 'Director' | null;
  readonly crashReportingEnabled: boolean;
  readonly breadcrumbs: readonly { readonly message: string; readonly timestamp: string }[];
  /** Injected so tests can intercept the link without opening the OS mail client. */
  readonly openLink?: (url: string) => void;
  readonly testID?: string;
}

/** Strip every known free-text field from a breadcrumb before embedding in mail. */
function safeMessage(message: string): string {
  // Drop anything that looks like an email address, phone number, or ULID
  // — these are the PII surfaces CLAUDE.md §12 names.
  return message
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[email]')
    .replace(/(\+?\d[\d\s-]{7,}\d)/g, '[phone]');
}

export function buildFeedbackMailto(args: {
  appVersion: string;
  platform: string;
  role: string | null;
  consent: boolean;
  breadcrumbs: readonly { message: string; timestamp: string }[];
}): string {
  const bodyLines = [
    '',
    '---',
    `App: Cachink! ${args.appVersion}`,
    `Plataforma: ${args.platform}`,
    `Rol: ${args.role ?? 'n/a'}`,
  ];
  if (args.consent && args.breadcrumbs.length > 0) {
    bodyLines.push('', 'Últimos eventos:');
    for (const b of args.breadcrumbs.slice(-10)) {
      bodyLines.push(`• ${b.timestamp} — ${safeMessage(b.message)}`);
    }
  }
  const body = encodeURIComponent(bodyLines.join('\n'));
  const subject = encodeURIComponent('Comentarios sobre Cachink!');
  return `mailto:feedback@cachink.mx?subject=${subject}&body=${body}`;
}

export function FeedbackAction(props: FeedbackActionProps): ReactElement {
  const { t } = useTranslation();
  const open =
    props.openLink ??
    ((url: string) => {
      if (typeof globalThis.window !== 'undefined') {
        globalThis.window.location.href = url;
      }
    });
  function handlePress(): void {
    const url = buildFeedbackMailto({
      appVersion: props.appVersion,
      platform: props.platform,
      role: props.role,
      consent: props.crashReportingEnabled,
      breadcrumbs: [...props.breadcrumbs],
    });
    open(url);
  }
  return (
    <Card padding="md" fullWidth testID={props.testID ?? 'settings-feedback-card'}>
      <Btn variant="soft" onPress={handlePress} fullWidth testID="settings-feedback-button">
        {t('settings.feedbackCta')}
      </Btn>
    </Card>
  );
}
