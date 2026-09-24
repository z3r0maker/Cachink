'use client';

import { useState } from 'react';
import { formatMoney } from '@xangarro/domain';

import {
  Banner,
  Button,
  Card,
  Celebration,
  ConfirmDialog,
  Input,
  OptionCards,
  Seal,
  StatusPill,
  Switch,
  Tag,
  UsageBar,
  type OptionDef,
} from '@/components';
import { AvisoLinea } from '@/avisos/linea';

import { eyebrow, row, section } from './page.css';

const NIVELES: readonly OptionDef[] = [
  { value: 'empujon', title: 'Un empujón · +10%', description: 'Un primer avance.' },
  { value: 'reto', title: 'Un reto · +20%', description: 'Lo que suele funcionar.' },
  { value: 'ambicioso', title: 'Ambicioso · +30%', description: 'Para un buen mes.' },
];

/** Switches, meters and pills. */
function Controles({ on, setOn }: { readonly on: boolean; readonly setOn: (v: boolean) => void }) {
  return (
    <div className={row}>
      <Switch checked={on} onCheckedChange={setOn} label="Seguir existencias" />
      <UsageBar label="Operadores" used={2} limit={5} />
      <Tag tone="brand">Don Cuentas</Tag>
      <StatusPill tone="success">Sincronizado</StatusPill>
    </div>
  );
}

/** The option cards, the money-shaped field and the seals. */
function Elecciones({
  monto,
  setMonto,
}: {
  readonly monto: string;
  readonly setMonto: (v: string) => void;
}) {
  const [opcion, setOpcion] = useState('reto');
  return (
    <>
      <div className={row}>
        <OptionCards ariaLabel="Nivel" options={NIVELES} value={opcion} onValueChange={setOpcion} />
      </div>
      <div className={row}>
        <Input
          labelText="Monto del movimiento"
          hintText={formatMoney(125_000n)}
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          inputMode="decimal"
        />
        <Seal level="plata" label="3 metas" />
        <Seal level="oro" label="6 metas" />
      </div>
    </>
  );
}

/** Two aviso rows — the inbox's line shape. */
function Avisos() {
  return (
    <Card>
      <AvisoLinea
        n={{
          id: 'inv-1',
          source: 'sistema',
          severity: 'warning',
          title: 'Discrepancia en el corte de caja',
          body: 'El corte del sábado cuenta $6.00 menos de lo esperado.',
          ctaLabel: 'Revisar',
          ctaHref: '/cortes',
          state: 'nuevo',
          createdAt: '2026-05-12T10:00:00.000Z',
        }}
        mayWrite={false}
      />
      <AvisoLinea
        n={{
          id: 'inv-2',
          source: 'operacion',
          severity: 'info',
          title: 'Función activada',
          body: 'El inventario ahora se descuenta con cada venta.',
          ctaLabel: null,
          ctaHref: null,
          state: 'leido',
          createdAt: '2026-05-11T22:00:00.000Z',
        }}
        mayWrite={false}
      />
    </Card>
  );
}

/** The locked-teaser banner shape. */
function FilaBloqueada() {
  return (
    <Banner
      tone="info"
      title="Fila bloqueada"
      body="El Diagnóstico completo llega con el plan Xangarrote."
      action={
        <Button size="sm" variant="secondary">
          Ver planes
        </Button>
      }
    />
  );
}

/** The confirm dialog, over its trigger. */
function DialogoConfirm({
  open,
  set,
}: {
  readonly open: boolean;
  readonly set: (v: boolean) => void;
}) {
  return (
    <>
      <Button variant="secondary" onClick={() => set(true)}>
        Abrir diálogo
      </Button>
      <ConfirmDialog
        open={open}
        title="Revocar dispositivo"
        body="Revocar borra el acceso, no los datos ya sincronizados."
        confirmLabel="Revocar"
        destructive
        onConfirm={() => set(false)}
        onOpenChange={set}
      />
    </>
  );
}

/** The celebration, over its trigger. */
function Celebracion({
  open,
  set,
}: {
  readonly open: boolean;
  readonly set: (v: boolean) => void;
}) {
  return (
    <>
      <Button variant="secondary" onClick={() => set(true)}>
        Abrir celebración
      </Button>
      <Celebration
        open={open}
        onClose={() => set(false)}
        title="¡Lograste tu meta!"
        body="Inventario de la celebración."
        level="oro"
        streak={3}
      />
    </>
  );
}

/** The primitives that joined after the first inventory: P-23's second half. */
export function Recientes() {
  const [switchOn, setSwitchOn] = useState(true);
  const [dialogo, setDialogo] = useState(false);
  const [celebrar, setCelebrar] = useState(false);
  const [monto, setMonto] = useState('1250.00');

  return (
    <div className={section} data-testid="inventario-recientes">
      <span className={eyebrow}>Switch · OptionCards · UsageBar · Diálogos · Sellos · Avisos</span>
      <Controles on={switchOn} setOn={setSwitchOn} />
      <Elecciones monto={monto} setMonto={setMonto} />
      <div className={row}>
        <DialogoConfirm open={dialogo} set={setDialogo} />
        <Celebracion open={celebrar} set={setCelebrar} />
      </div>
      <Avisos />
      <FilaBloqueada />
    </div>
  );
}
