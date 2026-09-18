'use client';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  StatusPill,
  Tag,
  type Tone,
} from '@/components';

import { eyebrow, grid, h1, row, section } from './page.css';

const TONES: readonly Tone[] = ['neutral', 'success', 'danger', 'warning', 'info', 'brand', 'soft'];

export function Buttons() {
  return (
    <div className={section}>
      <span className={eyebrow}>Botones</span>
      <div className={row}>
        <Button variant="primary">Registrar venta</Button>
        <Button variant="secondary">Exportar</Button>
        <Button variant="dark">Ver estados</Button>
        <Button variant="danger">Revocar</Button>
        <Button variant="soft">Cambiar tarjeta</Button>
        <Button variant="ghost">Cancelar</Button>
      </div>
      <div className={row}>
        <Button size="sm">Pequeño</Button>
        <Button size="md">Mediano</Button>
        <Button size="lg">Grande</Button>
        <Button disabled>Deshabilitado</Button>
      </div>
    </div>
  );
}

export function Tags() {
  return (
    <div className={section}>
      <span className={eyebrow}>Etiquetas y píldoras de estado</span>
      <div className={row}>
        {TONES.map((tone) => (
          <Tag key={tone} tone={tone}>
            {tone}
          </Tag>
        ))}
      </div>
      <div className={row}>
        <StatusPill tone="success">Turno abierto</StatusPill>
        <StatusPill tone="neutral">Caja cerrada</StatusPill>
        <StatusPill tone="warning">3 registros no enviados</StatusPill>
        <StatusPill tone="danger">Stock bajo</StatusPill>
      </div>
    </div>
  );
}

export function Cards() {
  return (
    <div className={section}>
      <span className={eyebrow}>Tarjetas</span>
      <div className={grid}>
        <Card emphasis="hero" tone="hero">
          <span className={eyebrow}>Utilidad del mes</span>
          <p className={h1}>$15,197.62</p>
        </Card>
        <Card interactive>
          <span className={eyebrow}>Ventas hoy</span>
          <p className={h1}>$4,850.00</p>
        </Card>
        <Card tone="muted" emphasis="inset">
          <span className={eyebrow}>Capturó hoy</span>
          <p className={h1}>20</p>
        </Card>
      </div>
    </div>
  );
}

export function Fields() {
  return (
    <div className={section}>
      <span className={eyebrow}>Campos</span>
      <div style={{ maxWidth: 420 }}>
        <Input labelText="Nombre del negocio" placeholder="Taquería Don Pedro" />
        <Input labelText="Precio de venta" numeric defaultValue="40.00" hintText="En pesos." />
        <Input labelText="RFC" defaultValue="xaxx010101" error="RFC no válido" />
      </div>
    </div>
  );
}

export function States() {
  return (
    <div className={section}>
      <span className={eyebrow}>Estados</span>
      <EmptyState
        title="Aún no tienes productos"
        body="Agrega tu primer producto o impórtalos desde Excel para que tus operadores puedan vender."
        action={{ label: 'Nuevo producto', onClick: () => undefined }}
      />
      <ErrorState onRetry={() => undefined} />
      <LoadingState blocks={[120, 80]} />
    </div>
  );
}
