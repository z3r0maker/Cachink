'use client';

import { IdCard } from 'lucide-react';

import { Banner, Button, Card, Input } from '@/components';
import { AVISO_INTEGRAL_URL } from '@/legal/aviso-simplificado';

import { dos, pila } from '../../_publico/publico.css';
import * as s from './arco.css';
import { Derechos } from './derechos';
import type { ArcoForm } from './use-arco';

function Descripcion(props: { readonly value: string; readonly onChange: (v: string) => void }) {
  return (
    <div className={s.campo}>
      <div className={s.etiquetaFila}>
        <label htmlFor="arco-descripcion" className={s.etiqueta}>
          Qué datos y qué necesitas
        </label>
        <span className={s.contador} aria-hidden="true">
          {props.value.length.toLocaleString('es-MX')} / 4,000
        </span>
      </div>
      <textarea
        id="arco-descripcion"
        className={s.texto}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Por ejemplo: quiero saber qué datos de mi negocio tienen guardados y con quién los comparten."
      />
    </div>
  );
}

function Identidad() {
  return (
    <p className={s.identidad}>
      <IdCard size={20} className={s.identidadIcono} aria-hidden="true" />
      <span>
        Para proteger tus datos, antes de actuar te pediremos por correo una identificación. Aviso
        de privacidad completo:{' '}
        <a className={s.enlace} href={AVISO_INTEGRAL_URL}>
          xangarro.mx/privacidad
        </a>
        .
      </span>
    </p>
  );
}

function Quien({ f }: { readonly f: ArcoForm }) {
  return (
    <div className={dos}>
      <Input
        labelText="Nombre completo"
        autoComplete="name"
        placeholder="Como en tu identificación"
        value={f.nombre}
        onChange={(e) => f.setNombre(e.target.value)}
        maxLength={120}
      />
      <Input
        labelText="Correo para la respuesta"
        type="email"
        autoComplete="email"
        placeholder="tucorreo@ejemplo.mx"
        value={f.correo}
        onChange={(e) => f.setCorreo(e.target.value)}
        maxLength={200}
      />
    </div>
  );
}

function Envio({ f }: { readonly f: ArcoForm }) {
  return (
    <div className={s.enviar}>
      <Button
        type="submit"
        size="lg"
        disabled={f.pending}
        aria-describedby={f.falta ? 'arco-falta' : undefined}
      >
        {f.pending ? 'Enviando…' : 'Enviar solicitud'}
      </Button>
      {f.falta ? (
        <p id="arco-falta" className={s.faltaIzq}>
          {f.falta}
        </p>
      ) : null}
    </div>
  );
}

/** The ARCO form: who you are, which right, what exactly; then the folio. */
export function FormularioArco({ f }: { readonly f: ArcoForm }) {
  return (
    <Card emphasis="hero">
      <form onSubmit={f.enviar} noValidate className={pila}>
        {f.result && !f.result.ok ? <Banner tone="critical" title={f.result.message} /> : null}
        <Quien f={f} />
        <Derechos value={f.derecho} onChange={f.setDerecho} />
        <Descripcion value={f.descripcion} onChange={f.setDescripcion} />
        <Identidad />
        <Envio f={f} />
      </form>
    </Card>
  );
}
