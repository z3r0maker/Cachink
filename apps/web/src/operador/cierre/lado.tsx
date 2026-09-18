import { formatMoney } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import * as ts from '../turno/turno.css';
import { desglose } from '../turno/desglose';
import { ChoiceChips } from '../ui/choice';
import * as f from '../ui/field.css';
import * as u from '../ui/ui.css';
import * as s from './cierre.css';
import { DIF } from './copy';
import { MOTIVOS_DIFERENCIA, type CierreData } from './types';
import type { Cierre } from './use-cierre';

/** The yellow card: expected cash and its four parts. */
export function Esperado({ x, data }: { readonly x: Cierre; readonly data: CierreData }) {
  return (
    <div className={s.tarjeta} style={{ padding: 20, background: colors.yellow }}>
      <div className={u.eyebrow} style={{ color: colors.black }}>
        Efectivo esperado
      </div>
      <div className={s.esperado}>{formatMoney(x.esperado)}</div>
      <div className={ts.breakdown} style={{ gap: 8 }}>
        {desglose(data.partes).map(([label, value]) => (
          <div key={label} className={ts.breakdownRow} style={{ paddingBottom: 7 }}>
            <span className={ts.breakdownLabel}>{label}</span>
            <span className={ts.breakdownValue} style={{ fontSize: portalFontSizes.body }}>
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Cuadra (green), Falta (red) or Sobra (blue), with what to do. */
export function Diferencia({ x }: { readonly x: Cierre }) {
  const d = DIF[x.dif.tipo];
  return (
    <div className={s.tarjeta} style={{ padding: 20, gap: 10, background: d.bg }}>
      <div className={u.eyebrow}>Diferencia</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className={s.difLabel}>{d.label}</span>
        <span className={s.cifra} style={{ fontSize: portalFontSizes.display }}>
          {formatMoney(x.dif.monto)}
        </span>
      </div>
      <div className={s.texto}>{d.hint}</div>
    </div>
  );
}

/** Only with a difference: a reason and a note are required to close. */
export function Explica({ x, dueno }: { readonly x: Cierre; readonly dueno: string }) {
  return (
    <div className={s.tarjeta}>
      <div className={u.eyebrow}>Explica la diferencia</div>
      <ChoiceChips options={MOTIVOS_DIFERENCIA} value={x.motivo} onChange={x.setMotivo} />
      <input
        type="text"
        aria-label="Nota"
        className={f.text}
        style={{ height: 52 }}
        placeholder="Cuenta qué pasó, con tus palabras"
        value={x.nota}
        onChange={(e) => x.setNota(e.target.value)}
      />
      <div className={s.texto} style={{ color: colors.gray600 }}>
        {dueno} va a leer esto junto con el corte. Es mejor una nota corta que un faltante sin
        explicación.
      </div>
    </div>
  );
}
