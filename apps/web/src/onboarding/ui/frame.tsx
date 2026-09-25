import type { ReactNode } from 'react';

import { Banner } from '@/components';

import { column, link, page, subtitle, title } from './onboarding.css';

/** The onboarding page chrome: heading, optional subtitle, one column. */
export function OnboardingFrame(props: {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
}) {
  return (
    <main className={page}>
      <div className={column}>
        <header>
          <h1 className={title}>{props.title}</h1>
          {props.subtitle ? <p className={subtitle}>{props.subtitle}</p> : null}
        </header>
        {props.children}
      </div>
    </main>
  );
}

/**
 * The error state of a server-rendered onboarding page. A plain link retries:
 * the page is a server component and has no handler to pass.
 */
export function LoadFailed({ retry }: { readonly retry: string }) {
  return (
    <OnboardingFrame title="Algo salió mal">
      <Banner
        tone="critical"
        title="No pudimos cargar esta página."
        body="Tus respuestas están guardadas."
        action={
          <a className={link} href={retry}>
            Reintentar
          </a>
        }
      />
    </OnboardingFrame>
  );
}
