'use client';

import { Banner, Button, Delta, KpiCard, Verdict, kpiGrid } from '@/components';

import { eyebrow, section } from './page.css';

export function Kpis() {
  return (
    <div className={section}>
      <span className={eyebrow}>Indicadores</span>
      <div className={kpiGrid}>
        <KpiCard label="Ventas hoy" value="$4,850.00" tone="positive" hint="12 ventas registradas">
          <Delta direction="up" label="12% vs ayer" />
        </KpiCard>
        <KpiCard label="Gastos hoy" value="$1,240.00" tone="negative" hint="3 egresos" />
        <KpiCard label="Utilidad hoy" value="$3,610.00" hint="Lo que te quedó hoy">
          <Verdict tone="healthy">Tu negocio fue rentable hoy.</Verdict>
        </KpiCard>
        <KpiCard label="Cuentas por cobrar" value="$3,940.00" tone="warning" hint="4 clientes" />
      </div>
    </div>
  );
}

export function Banners() {
  return (
    <div className={section}>
      <span className={eyebrow}>Avisos globales</span>
      <Banner
        tone="critical"
        title="3 registros no se pudieron sincronizar."
        body="Revísalos para que tus números cuadren."
        action={
          <Button size="sm" variant="secondary">
            Revisar
          </Button>
        }
      />
      <Banner
        tone="warning"
        title="Tu pago está pendiente."
        body="Tienes hasta el 18 de mayo de 2026."
        action={<Button size="sm">Actualizar pago</Button>}
      />
    </div>
  );
}
