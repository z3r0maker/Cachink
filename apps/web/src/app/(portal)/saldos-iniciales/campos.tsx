'use client';

import { Banner, Button, ConfirmDialog, Input } from '@/components';

import { pageSubtitle, pageTitle } from '../productos/productos.css';

/** The saldos screen's presentational pieces, split out for size. */

export interface CamposForm {
  readonly fecha: string;
  readonly setFecha: (v: string) => void;
  readonly caja: string;
  readonly setCaja: (v: string) => void;
  readonly bancos: string;
  readonly setBancos: (v: string) => void;
}

export function CamposApertura({
  f,
  editable,
}: {
  readonly f: CamposForm;
  readonly editable: boolean;
}) {
  return (
    <div style={{ display: 'grid', gap: 14, maxWidth: 380, marginTop: 16 }}>
      <Input
        labelText="Fecha de apertura"
        value={f.fecha}
        disabled={!editable}
        onChange={(e) => f.setFecha(e.target.value)}
        placeholder="2026-09-01"
        hintText="YYYY-MM-DD"
      />
      <Input
        labelText="Caja (efectivo)"
        value={f.caja}
        disabled={!editable}
        onChange={(e) => f.setCaja(e.target.value)}
        placeholder="1500"
        numeric
      />
      <Input
        labelText="Bancos"
        value={f.bancos}
        disabled={!editable}
        onChange={(e) => f.setBancos(e.target.value)}
        placeholder="20000"
        numeric
      />
    </div>
  );
}

export function AccionesSaldos({
  pending,
  onGuardar,
  onBloquear,
}: {
  readonly pending: boolean;
  readonly onGuardar: () => void;
  readonly onBloquear: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
      <Button variant="primary" disabled={pending} onClick={onGuardar}>
        {pending ? 'Guardando…' : 'Guardar saldos'}
      </Button>
      <Button variant="secondary" disabled={pending} onClick={onBloquear}>
        Bloquear saldos iniciales
      </Button>
    </div>
  );
}

export function ConfirmarBloqueo({
  onCerrar,
  onBloquear,
}: {
  readonly onCerrar: () => void;
  readonly onBloquear: () => void;
}) {
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onCerrar()}
      title="¿Bloquear los saldos iniciales?"
      body="Se vuelven de solo lectura: los estados que emitiste dejan de poder cambiar por atrás. No se deshace."
      confirmLabel="Bloquear"
      destructive
      onConfirm={() => {
        onCerrar();
        onBloquear();
      }}
    />
  );
}

export function EncabezadoSaldos({
  banner,
  lockedAt,
}: {
  readonly banner: { tone: 'success' | 'critical'; text: string } | null;
  readonly lockedAt: string | null;
}) {
  return (
    <>
      <h1 className={pageTitle}>Saldos iniciales</h1>
      <p className={pageSubtitle}>
        Lo que tu negocio tenía el día uno: caja, bancos y cuentas por cobrar
      </p>
      {banner !== null ? <Banner tone={banner.tone} title={banner.text} /> : null}
      {lockedAt !== null ? (
        <Banner tone="info" title={`Bloqueados el ${lockedAt.slice(0, 10)}. Ya no se editan.`} />
      ) : null}
    </>
  );
}
