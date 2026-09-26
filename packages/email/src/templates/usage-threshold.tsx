/**
 * The owner's 80 % / 100 % usage email (N-03). Never punitive: the business
 * is growing, nothing stops, nothing is lost. The upsell lives here and in
 * the portal, never in the app (ADR-069).
 */
import type { EmailContent, UsageThresholdNotice } from '@xangarro/application/email';

import { entero, renderEmail } from '../render.js';
import { Cta, Layout, P, Small } from './layout.js';
import { ALL_PRICE_LINES } from './plans.js';

export interface UsageThresholdEmailProps {
  readonly threshold: 80 | 100;
  readonly metric: UsageThresholdNotice['metric'];
  readonly used: number;
  readonly limit: number;
  /** The portal's Suscripción page (plans and prices). */
  readonly plansUrl: string;
  readonly name: string | null;
}

const METRIC: Record<UsageThresholdNotice['metric'], string> = {
  transactions: 'movimientos registrados este mes',
  activeProducts: 'productos activos',
};

const SUBJECT: Record<80 | 100, string> = {
  80: 'Tu negocio está creciendo 🎉 Vas en el 80 % de tu plan',
  100: 'Tu negocio está creciendo 🎉 Llegaste al límite de tu plan',
};

export function UsageThresholdEmail(p: UsageThresholdEmailProps) {
  const count = `${entero(p.used)} de ${entero(p.limit)} ${METRIC[p.metric]}`;
  return (
    <Layout preview={`Llevas ${count}.`}>
      <P>{p.name ? `Hola, ${p.name}:` : 'Hola:'}</P>
      <P>¡Buenas noticias! Tu negocio va en {count}.</P>
      <P>
        {p.threshold === 100
          ? 'Nada se detiene: todo lo que registren tus cajas se sigue guardando y sincronizando.'
          : 'Todo sigue funcionando igual. Te avisamos con tiempo para que decidas con calma.'}
      </P>
      <P>Si quieres más espacio, puedes cambiar de plan cuando quieras:</P>
      {ALL_PRICE_LINES.map((line) => (
        <Small key={line}>{line}.</Small>
      ))}
      <Cta href={p.plansUrl}>Ver planes y precios</Cta>
      <Small>Los precios no incluyen IVA (16 %); el total se muestra antes de pagar.</Small>
    </Layout>
  );
}

export function renderUsageThresholdEmail(p: UsageThresholdEmailProps): Promise<EmailContent> {
  return renderEmail(SUBJECT[p.threshold], <UsageThresholdEmail {...p} />);
}
