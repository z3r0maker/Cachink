import type { ConsultaSat } from '@xangarro/application/corp';
import type { CfdiRecibido, EstadoSat } from '@xangarro/domain/corp';

/**
 * The SAT's public CFDI status service (E-11): «Vigente», «Cancelado» or «No
 * Encontrado» for an invoice's RFCs, total and UUID. It needs no credentials.
 *
 * It never throws: a timeout, an error or an answer it cannot read is
 * `sin_respuesta`, and the founder goes on with the invoice unverified.
 *
 * `CORP_SAT_CONSULTA=simulada` answers without the network, for e2e: a UUID
 * starting `00000000` is cancelled, `FFFFFFFF` not found, anything else valid.
 * Production never sets it.
 */
export const SAT_URL = 'https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc';
const ACTION = 'http://tempuri.org/IConsultaCFDIService/Consulta';
const TIMEOUT_MS = 8_000;

export function expresion(c: CfdiRecibido): string {
  const q = new URLSearchParams({
    re: c.emisor.rfc,
    rr: c.receptor.rfc,
    tt: c.sat.total,
    id: c.uuid,
    fe: c.sat.sello8,
  });
  return `?${q.toString()}`;
}

export function sobre(c: CfdiRecibido): string {
  return (
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:tem="http://tempuri.org/"><soapenv:Header/><soapenv:Body><tem:Consulta>' +
    `<tem:expresionImpresa><![CDATA[${expresion(c)}]]></tem:expresionImpresa>` +
    '</tem:Consulta></soapenv:Body></soapenv:Envelope>'
  );
}

/** The `<Estado>` of the SAT's answer, whatever its namespace prefix. */
export function estadoDeRespuesta(xml: string): EstadoSat {
  const estado = /<(?:\w+:)?Estado>([^<]*)</.exec(xml)?.[1]?.trim().toLowerCase();
  if (estado === 'vigente') return 'vigente';
  if (estado === 'cancelado') return 'cancelado';
  if (estado === 'no encontrado') return 'no_encontrado';
  return 'sin_respuesta';
}

export function simulada(c: CfdiRecibido): EstadoSat {
  if (c.uuid.startsWith('00000000')) return 'cancelado';
  if (c.uuid.startsWith('FFFFFFFF')) return 'no_encontrado';
  return 'vigente';
}

export function consultaSat(fetcher: typeof fetch = fetch): ConsultaSat {
  if (process.env.CORP_SAT_CONSULTA === 'simulada') return { estado: async (c) => simulada(c) };
  return {
    estado: async (c) => {
      try {
        const res = await fetcher(SAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: ACTION },
          body: sobre(c),
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: 'no-store',
        });
        return res.ok ? estadoDeRespuesta(await res.text()) : 'sin_respuesta';
      } catch (error) {
        console.warn('[empresa] la consulta al SAT no respondió', error);
        return 'sin_respuesta';
      }
    },
  };
}
