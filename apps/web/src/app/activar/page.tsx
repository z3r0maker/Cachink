import type { Metadata } from 'next';

import { page, title } from './activar.css';

/**
 * `/activar` — where a pairing QR lands (C-14, SEC-MOB-04).
 *
 * The token is in the fragment (`#c=…`), which the browser never sends, so
 * this server never sees it and nothing here redeems anything: a WhatsApp
 * link preview fetching the page consumes nothing. On a phone with Xangarro
 * installed the verified app link opens the app instead of this page (N-25);
 * this is what everyone else sees.
 */
export const metadata: Metadata = {
  title: 'Vincular un teléfono · Xangarro',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ActivarPage() {
  return (
    <main className={page}>
      <h1 className={title}>Vincula este teléfono a tu negocio</h1>
      <p>
        Abre este enlace en el teléfono donde está instalada la app Xangarro: se abrirá la app y te
        pedirá confirmar el negocio antes de vincularlo.
      </p>
      <p>
        ¿Todavía no tienes la app? Descárgala desde la tienda de tu teléfono y vuelve a escanear el
        código QR que te muestra el portal. El enlace vence a los 15 minutos y sirve una sola vez.
      </p>
      <p>
        ¿Prefieres escribirlo? En la app elige «Escribir código» y captura el código de 8 letras con
        el correo del dueño.
      </p>
    </main>
  );
}
