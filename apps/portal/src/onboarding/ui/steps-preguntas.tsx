'use client';

import type { WizardAnswers } from '@xangarro/domain';

import { Banner } from '@/components';

import { PERSONAS, toYesNo, yesNo } from '../choices';
import { PickOne } from './choice-cards';
import { stack } from './onboarding.css';
import { PasoCobro, PasoContacto, PasoNegocio, type StepProps } from './steps-datos';

type BoolKey = 'manejaInventario' | 'manejaCajaEfectivo' | 'vendeACredito' | 'tieneDatosFiscales';

function SiNo(
  props: StepProps & { readonly k: BoolKey; readonly copy: [string, string, string, string] },
) {
  const [si, siDesc, no, noDesc] = props.copy;
  return (
    <PickOne
      label={si}
      choices={yesNo(si, siDesc, no, noDesc)}
      value={toYesNo(props.draft[props.k])}
      onChange={(v) => props.set({ [props.k]: v === 'si' } as WizardAnswers)}
    />
  );
}

/**
 * Paso 5. Saying "no" while Crédito is one of the payment methods is not
 * refused — it is explained, and the save drops Crédito (`reconcile`).
 */
function PasoCredito(props: StepProps & { readonly stored: WizardAnswers }) {
  const drops =
    props.draft.vendeACredito === false && props.stored.metodosCobro?.includes('Crédito');
  return (
    <div className={stack}>
      <SiNo
        {...props}
        k="vendeACredito"
        copy={[
          'Sí, vendo a crédito',
          'Llevas cuentas por cobrar de tus clientes.',
          'No, todo es de contado',
          'Te pagan en el momento.',
        ]}
      />
      {drops ? <Banner tone="info" title="Quitaremos Crédito de tus formas de cobro." /> : null}
    </div>
  );
}

const SI_NO: Readonly<Record<number, { k: BoolKey; copy: [string, string, string, string] }>> = {
  2: {
    k: 'manejaInventario',
    copy: ['Sí, llevo inventario', 'Sé cuántas piezas tengo.', 'No', 'No cuento piezas.'],
  },
  3: {
    k: 'manejaCajaEfectivo',
    copy: ['Sí, tengo caja', 'Cuento el efectivo al cerrar.', 'No', 'No manejo efectivo en caja.'],
  },
  6: {
    k: 'tieneDatosFiscales',
    copy: ['Sí, los tengo', 'RFC y régimen fiscal.', 'Todavía no', 'Puedes empezar sin ellos.'],
  },
};

/** The body of step `index` (0-based). */
export function StepBody(
  props: StepProps & { readonly index: number; readonly stored: WizardAnswers },
) {
  const siNo = SI_NO[props.index];
  if (siNo !== undefined) return <SiNo {...props} k={siNo.k} copy={siNo.copy} />;
  switch (props.index) {
    case 0:
      return <PasoNegocio {...props} />;
    case 1:
      return <PasoCobro {...props} />;
    case 4:
      return <PasoCredito {...props} />;
    case 5:
      return <PasoContacto {...props} />;
    default:
      return (
        <PickOne
          label="Personas que cobran"
          choices={PERSONAS}
          value={props.draft.personasQueCobran?.toString() ?? null}
          onChange={(v) => props.set({ personasQueCobran: Number(v) })}
        />
      );
  }
}
