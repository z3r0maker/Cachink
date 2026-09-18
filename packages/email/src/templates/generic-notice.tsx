/**
 * A plain notice for anything without a template of its own yet — ARCO
 * confirmations (N-34), dormancy (N-48), one-off operational notes. Text is
 * escaped by React; pass plain strings, not HTML.
 */
import type { EmailContent } from '@xangarro/application/email';

import { renderEmail } from '../render.js';
import { Cta, Layout, P } from './layout.js';

export interface GenericNoticeProps {
  readonly subject: string;
  readonly preview: string;
  readonly paragraphs: readonly string[];
  readonly cta?: { readonly label: string; readonly href: string };
  readonly reason?: string;
}

export function GenericNoticeEmail(p: GenericNoticeProps) {
  return (
    <Layout preview={p.preview} {...(p.reason === undefined ? {} : { reason: p.reason })}>
      {p.paragraphs.map((text, i) => (
        <P key={i}>{text}</P>
      ))}
      {p.cta ? <Cta href={p.cta.href}>{p.cta.label}</Cta> : null}
    </Layout>
  );
}

export function renderGenericNoticeEmail(p: GenericNoticeProps): Promise<EmailContent> {
  return renderEmail(p.subject, <GenericNoticeEmail {...p} />);
}
