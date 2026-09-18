/**
 * The 08:00 staff digest (N-10). The console builds the sections
 * (`apps/admin/src/server/alerts/digest-render.ts` → `digestSections`); this
 * only lays them out. Staff-facing, so it is dense and link-heavy.
 */
import { Heading, Link, Section } from '@react-email/components';
import type { EmailContent } from '@xangarro/application/email';
import { colors } from '@xangarro/tokens';

import { renderEmail } from '../render.js';
import { Layout, P, Small } from './layout.js';

export interface DigestLine {
  readonly label: string;
  readonly href?: string;
  readonly urgent?: boolean;
}

export interface DigestSection {
  readonly title: string;
  /** Shown instead of the list when the section has nothing. */
  readonly empty: string | null;
  readonly lines: readonly DigestLine[];
  readonly note: string | null;
}

export interface StaffDigestProps {
  readonly subject: string;
  readonly sections: readonly DigestSection[];
}

const h2 = { color: colors.black, fontSize: 17, margin: '20px 0 8px' } as const;
const REASON = 'Resumen interno del equipo de soporte de Xangarro.';

function Line({ line }: { readonly line: DigestLine }) {
  const tag = line.urgent ? <strong>URGENTE </strong> : null;
  return (
    <Small>
      • {tag}
      {line.href ? <Link href={line.href}>{line.label}</Link> : line.label}
    </Small>
  );
}

function DigestBlock({ section }: { readonly section: DigestSection }) {
  return (
    <Section>
      <Heading as="h2" style={h2}>
        {section.title}
      </Heading>
      {section.lines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
      {section.lines.length === 0 && section.empty ? <Small>{section.empty}</Small> : null}
      {section.note ? <Small>{section.note}</Small> : null}
    </Section>
  );
}

export function StaffDigestEmail({ subject, sections }: StaffDigestProps) {
  return (
    <Layout preview={subject} reason={REASON}>
      <P>
        <strong>{subject}</strong>
      </P>
      {sections.map((s) => (
        <DigestBlock key={s.title} section={s} />
      ))}
    </Layout>
  );
}

export function renderStaffDigestEmail(p: StaffDigestProps): Promise<EmailContent> {
  return renderEmail(p.subject, <StaffDigestEmail {...p} />);
}
