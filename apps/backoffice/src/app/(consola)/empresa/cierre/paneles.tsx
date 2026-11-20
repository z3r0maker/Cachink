import { formatMoney } from '@xangarro/domain';

import { Cajon } from '@/components/cajon';
import type { EncabezadoCierre } from '@/server/empresa/cierre-encabezado';
import { cuandoFue } from '@/server/empresa/cierre-historial';
import { hrefCierre, type DatosCierre, type PanelCierre } from '@/server/empresa/cierre-view';
import { fechaCorta, nombreMes } from '@/server/empresa/fechas';
import { ultimoDia } from '@xangarro/domain/corp';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { RechazarForm } from './acciones';
import { AprobarForm, BancoForm, ReabrirForm } from './formas';

/**
 * Board CD-10b's panels over the month: the bank balance, «Pedir reabrir»
 * and the other founder's approval. Each opens only when it may be used;
 * otherwise the page shows as it is.
 */
interface Props {
  readonly panel: PanelCierre | null;
  readonly mes: string;
  readonly founderId: string;
  readonly datos: DatosCierre;
  readonly enc: EncabezadoCierre;
}

const eyebrow = (mes: string) => `Cierre · ${nombreMes(mes)} de ${mes.slice(0, 4)}`;

function Aprobar({ mes, datos, enc }: Omit<Props, 'panel' | 'founderId'>) {
  const cerrado = [...(datos.eventos.get(mes) ?? [])].reverse().find((e) => e.kind === 'cerrado');
  return (
    <Cajon
      eyebrow={eyebrow(mes)}
      titulo={`Reabrir ${nombreMes(mes)}`}
      sub={`${enc.pedido?.quien ?? 'Un socio'} pidió reabrirlo. Quien lo pide no puede aprobarlo.`}
      cerrar={hrefCierre(mes)}
    >
      <div className={m.stack}>
        <div className={i.aviso}>
          <span>
            <span
              className={i.pasoSub}
            >{`${enc.pedido?.quien ?? ''} · ${enc.pedido?.cuando ?? ''}`}</span>
            <span className={i.pasoTitulo}>{`«${enc.pedido?.motivo ?? ''}»`}</span>
          </span>
        </div>
        {cerrado === undefined ? null : (
          <p className={i.muted}>
            {`Cerrado el ${cuandoFue(cerrado.at)} por ${datos.socios.get(cerrado.founderId) ?? 'un socio'}.`}
          </p>
        )}
        <p className={i.muted}>
          Al aprobarlo, se abre para los dos. El historial guarda quién lo pidió, quién lo aprobó y
          el motivo.
        </p>
        <div className={m.row}>
          <AprobarForm mes={mes} />
          <RechazarForm mes={mes} />
        </div>
      </div>
    </Cajon>
  );
}

export function Paneles({ panel, mes, founderId, datos, enc }: Props) {
  if (panel === 'banco' && !enc.cerrado) {
    return (
      <Cajon
        eyebrow={eyebrow(mes)}
        titulo="Saldo del banco"
        sub="Escribe el saldo del estado de cuenta. Lo comparamos con el de la consola al mismo día."
        cerrar={hrefCierre(mes)}
      >
        <BancoForm
          mes={mes}
          dia={fechaCorta(ultimoDia(mes))}
          consola={String(datos.detalle.banco.consola)}
          consolaTexto={formatMoney(datos.detalle.banco.consola)}
        />
      </Cajon>
    );
  }
  if (panel === 'reabrir' && enc.reabrirHref !== null && enc.pedido === null) {
    const otro = [...datos.socios].find(([id]) => id !== founderId)?.[1] ?? 'el otro socio';
    return (
      <Cajon
        eyebrow={eyebrow(mes)}
        titulo={`Pedir reabrir ${nombreMes(mes)}`}
        sub={`${nombreMes(mes).charAt(0).toUpperCase()}${nombreMes(mes).slice(1)} está cerrado. Para reabrirlo, ${otro} lo tiene que aprobar.`}
        cerrar={hrefCierre(mes)}
      >
        <ReabrirForm mes={mes} otro={otro} />
      </Cajon>
    );
  }
  if (panel === 'aprobar' && enc.pedido !== null && !enc.pedido.mio) {
    return <Aprobar mes={mes} datos={datos} enc={enc} />;
  }
  return null;
}
