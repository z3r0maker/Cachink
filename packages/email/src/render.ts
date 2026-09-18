/**
 * One render path for every template: HTML plus its plain-text alternative,
 * both from the same element, so the two parts cannot disagree.
 */
import { render } from '@react-email/render';
import type { EmailContent } from '@xangarro/application/email';
import type { ReactElement } from 'react';

export async function renderEmail(subject: string, element: ReactElement): Promise<EmailContent> {
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
  return { subject, html, text };
}

const MX_LONG_DATE = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Mexico_City',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** «21 de septiembre de 2026», in Mexico City. */
export function fechaLarga(iso: string): string {
  return MX_LONG_DATE.format(new Date(iso));
}

/** Integer centavos → «$199» or «$199.50» (display only; money stays integer). */
export function pesos(centavos: number): string {
  const whole = centavos % 100 === 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(centavos / 100);
}

export function entero(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n);
}
