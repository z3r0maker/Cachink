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
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components';
import {
  AVISO_PUBLICO_URL,
  PROVEEDOR,
  PROVEEDOR_LINEA,
  TERMINOS_PUBLICO_URL,
} from '@xangarro/domain';
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
  h1: {
    color: colors.black,
    fontSize: 24,
    lineHeight: '30px',
    fontWeight: 800,
    margin: '0 0 16px',
  },
  detalles: { border: `1.5px solid ${colors.gray200}`, borderRadius: 10, margin: '0 0 16px' },
  k: { color: colors.textMuted, fontSize: 14, padding: '10px 14px', margin: 0 },
  v: {
    color: colors.black,
    fontSize: 15,
    fontWeight: 700,
    padding: '10px 14px',
    margin: 0,
    textAlign: 'right' as const,
  },
  link: { color: colors.black },
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

export function Titulo({ children }: { readonly children: ReactNode }) {
  return <Heading style={s.h1}>{children}</Heading>;
}

/** The facts of the email as label · value rows (plan, period, date, total). */
export function Detalles({ filas }: { readonly filas: readonly (readonly [string, string])[] }) {
  return (
    <Section style={s.detalles}>
      {filas.map(([k, v]) => (
        <Row key={k}>
          <Column>
            <Text style={s.k}>{k}</Text>
          </Column>
          <Column>
            <Text style={s.v}>{v}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}

/** `secundario`: white with a black border, for an action that is not the page's pitch. */
export function Cta({
  href,
  children,
  secundario = false,
}: {
  readonly href: string;
  readonly children: ReactNode;
  readonly secundario?: boolean;
}) {
  const style = secundario ? { ...s.button, backgroundColor: colors.white } : s.button;
  return (
    <Section style={{ margin: '8px 0 24px' }}>
      <Button href={href} style={style}>
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
  /**
   * Billing emails (LFPC art. 76 Bis): the complaints contact, the supplier's
   * name and address, and the legal links in the footer.
   */
  readonly legal?: boolean;
}

const DEFAULT_REASON = 'Recibes este correo porque tienes una cuenta de Xangarro.';

function PieLegal() {
  return (
    <>
      <Small>¿Dudas o quejas? Responde a este correo o escribe a {PROVEEDOR.correo}.</Small>
      <Small>{PROVEEDOR_LINEA}</Small>
      <Small>
        <Link href={AVISO_PUBLICO_URL} style={s.link}>
          Aviso de privacidad
        </Link>
        {' · '}
        <Link href={TERMINOS_PUBLICO_URL} style={s.link}>
          Términos y condiciones
        </Link>
      </Small>
    </>
  );
}

export function Layout({ preview, children, reason = DEFAULT_REASON, legal = false }: LayoutProps) {
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
          {legal ? (
            <PieLegal />
          ) : (
            <>
              <Small>¿Dudas? Responde a este correo y te ayudamos.</Small>
              <Small>Xangarro · Finanzas para emprendedores</Small>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
}
