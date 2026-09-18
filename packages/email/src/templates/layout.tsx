/**
 * The frame every Xangarro email shares: wordmark header, one white card,
 * footer. Inline styles only — mail clients drop `<style>` blocks unevenly.
 *
 * **Logo placeholder:** the header is a yellow wordmark in text. When the
 * hosted logo exists (L-04, `https://xangarro.mx/email/logo.png`), swap the
 * `Wordmark` body for an `<Img>`; text keeps working with images blocked.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { colors } from '@xangarro/tokens';
import type { ReactNode } from 'react';

const FONT = 'Helvetica, Arial, sans-serif';

const s = {
  body: { backgroundColor: colors.offwhite, fontFamily: FONT, margin: 0, padding: '24px 0' },
  card: {
    backgroundColor: colors.white,
    border: `2px solid ${colors.black}`,
    borderRadius: 12,
    maxWidth: 560,
    padding: '24px 28px',
  },
  wordmark: {
    backgroundColor: colors.yellow,
    border: `2px solid ${colors.black}`,
    borderRadius: 8,
    color: colors.black,
    display: 'inline-block',
    fontSize: 20,
    fontWeight: 800,
    margin: '0 0 16px',
    padding: '4px 12px',
  },
  p: { color: colors.ink, fontSize: 16, lineHeight: '24px', margin: '0 0 16px' },
  small: { color: colors.textMuted, fontSize: 13, lineHeight: '20px', margin: '0 0 8px' },
  button: {
    backgroundColor: colors.yellow,
    border: `2px solid ${colors.black}`,
    borderRadius: 10,
    color: colors.black,
    fontSize: 16,
    fontWeight: 700,
    padding: '12px 20px',
    textDecoration: 'none',
  },
} as const;

export function Wordmark() {
  return <Text style={s.wordmark}>Xangarro!</Text>;
}

export function P({ children }: { readonly children: ReactNode }) {
  return <Text style={s.p}>{children}</Text>;
}

export function Small({ children }: { readonly children: ReactNode }) {
  return <Text style={s.small}>{children}</Text>;
}

export function Cta({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return (
    <Section style={{ margin: '8px 0 24px' }}>
      <Button href={href} style={s.button}>
        {children}
      </Button>
    </Section>
  );
}

export interface LayoutProps {
  /** The inbox preview line (shown after the subject). */
  readonly preview: string;
  readonly children: ReactNode;
  /** Why this person got the email; defaults to the owner-account line. */
  readonly reason?: string;
}

const DEFAULT_REASON = 'Recibes este correo porque tienes una cuenta de Xangarro.';

export function Layout({ preview, children, reason = DEFAULT_REASON }: LayoutProps) {
  return (
    <Html lang="es-MX">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={s.body}>
        <Container style={s.card}>
          <Wordmark />
          {children}
          <Hr style={{ borderColor: colors.gray200, margin: '24px 0 16px' }} />
          <Small>{reason}</Small>
          <Small>¿Dudas? Responde a este correo y te ayudamos.</Small>
          <Small>Xangarro · Finanzas para emprendedores</Small>
        </Container>
      </Body>
    </Html>
  );
}
