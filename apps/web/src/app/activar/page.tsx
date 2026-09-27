import type { Metadata } from 'next';

import { MarcoPublico } from '../_publico/marco';
import { ancho, bajada, cabeza, ceja, titulo, zona } from '../_publico/publico.css';
import { Paneles, Vence } from './paneles';
import { Pasos } from './pasos';

/**
 * `/activar` — where a pairing QR lands (C-14, SEC-MOB-04).
 *
 * The token is in the fragment (`#c=…`), which the browser never sends, so
 * this server never sees it and nothing here redeems anything: a WhatsApp
 * link preview fetching the page consumes nothing. On a phone with Xangarro
 * installed the verified app link opens the app instead of this page (N-25);
 * this is what everyone else sees. For the same reason the page cannot name
 * the business: nothing here knows which one the link is for.
 */
export const metadata: Metadata = {
  title: 'Vincular un teléfono · Xangarro',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function ActivarPage() {
  return (
    <MarcoPublico
      pose="senalando"
      titulo="Una caja más, en un minuto."
      bajada="Conecta el teléfono con tu negocio y empieza a cobrar. Tus ventas llegan solitas a tu portal."
    >
      <div className={`${zona} ${ancho.amplio}`}>
        <header className={cabeza}>
          <span className={ceja}>Vincular un teléfono</span>
          <h1 className={titulo}>Vincula este teléfono a tu negocio</h1>
          <p className={bajada}>
            La app te pedirá confirmar el negocio antes de vincularlo. Nada se conecta solo con
            abrir esta página.
          </p>
        </header>
        <Pasos />
        <Vence />
        <Paneles />
      </div>
    </MarcoPublico>
  );
}
