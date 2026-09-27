'use client';

import * as RadioGroup from '@radix-ui/react-radio-group';
import { Ban, Eye, PencilLine, ShieldOff, Trash2 } from 'lucide-react';

import * as s from './arco.css';

export const DERECHOS = [
  {
    value: 'acceso',
    title: 'Acceso',
    description: 'Saber qué datos tuyos tenemos y cómo los usamos.',
    icon: <Eye size={20} aria-hidden="true" />,
  },
  {
    value: 'rectificacion',
    title: 'Rectificación',
    description: 'Corregir datos inexactos o incompletos.',
    icon: <PencilLine size={20} aria-hidden="true" />,
  },
  {
    value: 'cancelacion',
    title: 'Cancelación',
    description: 'Que borremos tus datos de nuestros sistemas.',
    icon: <Trash2 size={20} aria-hidden="true" />,
  },
  {
    value: 'oposicion',
    title: 'Oposición',
    description: 'Que dejemos de usar tus datos para un fin.',
    icon: <Ban size={20} aria-hidden="true" />,
  },
  {
    value: 'revocacion',
    title: 'Revocar consentimiento',
    description: 'Retirar un permiso que nos diste, por ejemplo, las novedades por correo.',
    icon: <ShieldOff size={20} aria-hidden="true" />,
  },
] as const;

export function nombreDerecho(value: string | null): string {
  return DERECHOS.find((d) => d.value === value)?.title ?? '';
}

/**
 * The five rights as a two-column radio group (Radix: arrow keys and
 * `aria-checked`); the odd last one spans the row.
 */
export function Derechos(props: {
  readonly value: string | null;
  readonly onChange: (v: string) => void;
}) {
  return (
    <div className={s.campo}>
      <span id="arco-derecho" className={s.etiqueta}>
        ¿Qué derecho quieres ejercer?
      </span>
      <RadioGroup.Root
        className={s.derechos}
        value={props.value ?? undefined}
        onValueChange={props.onChange}
        aria-labelledby="arco-derecho"
      >
        {DERECHOS.map((d, i) => (
          <RadioGroup.Item
            key={d.value}
            value={d.value}
            className={i === 4 ? `${s.derecho} ${s.ancha}` : s.derecho}
          >
            <span className={s.derechoIcono}>{d.icon}</span>
            <span className={s.derechoTexto}>
              <span className={s.derechoTitulo}>{d.title}</span>
              <span className={s.derechoCuerpo}>{d.description}</span>
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
