import { BadgeCheck, Smartphone, Store } from 'lucide-react';

import { Card } from '@/components';

import { placaTono } from '../_publico/publico.css';
import * as s from './activar.css';

const PASOS = [
  {
    icono: <Smartphone size={24} />,
    tono: 'amarilla',
    titulo: 'Abre el enlace en el teléfono donde está la app Xangarro',
    cuerpo: 'Si la app está instalada, el enlace la abre solita.',
  },
  {
    icono: <Store size={24} />,
    tono: 'suave',
    titulo: 'Confirma el negocio',
    cuerpo: 'La app te muestra el nombre de tu negocio. Revisa que sea el correcto.',
  },
  {
    icono: <BadgeCheck size={24} />,
    tono: 'verde',
    titulo: 'Listo, ya puede cobrar',
    cuerpo: 'El teléfono queda como una caja de tu negocio.',
  },
] as const;

/** Open, confirm, sell: what happens on the phone, in order. */
export function Pasos() {
  return (
    <Card emphasis="hero">
      <ol className={s.pasos} aria-label="Pasos">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className={s.paso}>
            <span className={s.numero} aria-hidden="true">
              {i + 1}
            </span>
            <span className={placaTono[p.tono]} aria-hidden="true">
              {p.icono}
            </span>
            <span className={s.pasoTexto}>
              <span className={s.pasoTitulo}>{p.titulo}</span>
              <span className={s.pasoCuerpo}>{p.cuerpo}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
