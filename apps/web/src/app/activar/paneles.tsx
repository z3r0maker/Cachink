import { Clock } from 'lucide-react';

import { Card } from '@/components';

import * as s from './activar.css';

export function Vence() {
  return (
    <p className={s.vence} role="note">
      <Clock size={20} className={s.venceIcono} aria-hidden="true" />
      El enlace vence a los 15 minutos y sirve una sola vez. Si ya venció, pide uno nuevo desde el
      portal.
    </p>
  );
}

function Codigo() {
  return (
    <div className={s.codigo} aria-hidden="true">
      <span className={s.casillas}>
        {[0, 1, 2, 3].map((i) => (
          <span key={`a${i}`} className={s.casilla} />
        ))}
        <span className={s.guion} />
        {[0, 1, 2, 3].map((i) => (
          <span key={`b${i}`} className={s.casillaQuieta} />
        ))}
      </span>
      <span className={s.codigoPie}>Código de 8 letras</span>
    </div>
  );
}

/** No app yet, or no camera: the two other ways in. */
export function Paneles() {
  return (
    <div className={s.panales}>
      <Card emphasis="quiet">
        <section className={s.panel} aria-labelledby="ac-app">
          <h2 id="ac-app" className={s.panelTitulo}>
            ¿Todavía no tienes la app?
          </h2>
          <p className={s.panelTexto}>
            Descárgala desde la tienda de tu teléfono y vuelve a escanear el código QR que te
            muestra el portal.
          </p>
        </section>
      </Card>
      <Card emphasis="quiet">
        <section className={s.panel} aria-labelledby="ac-cod">
          <h2 id="ac-cod" className={s.panelTitulo}>
            ¿Prefieres escribirlo?
          </h2>
          <p className={s.panelTexto}>
            En la app elige «Escribir código» y captura el código de 8 letras con el correo del
            dueño.
          </p>
          <Codigo />
        </section>
      </Card>
    </div>
  );
}
