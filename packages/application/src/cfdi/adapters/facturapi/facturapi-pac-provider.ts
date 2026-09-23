/**
 * FacturapiPacProvider — `PacProvider` over Facturapi's REST API v2.
 *
 * Talks to the same endpoints as the official SDK (`facturapi` v5, a thin
 * fetch wrapper) through an injected `fetch`, so the request bodies stay
 * typed and tests need no network. Test keys (`sk_test_…`) never reach the
 * SAT; live keys (`sk_live_…`) stamp real CFDIs. Config: facturapi-config.ts.
 */

import type { PacProvider } from '../../pac-provider.js';
import type {
  CancelCfdiRequest,
  CancellationStatus,
  StampCreditNoteRequest,
  StampGlobalInvoiceRequest,
  StampInvoiceRequest,
  StampPaymentComplementRequest,
  StampedCfdi,
} from '../../types.js';
import type { FacturapiConfig } from './facturapi-config.js';
import { send, type HttpFetch, type HttpRequestInit } from './http.js';
import {
  complementBody,
  creditNoteBody,
  globalBody,
  invoiceBody,
  toCancellationStatus,
  toStamped,
} from './mapper.js';

export interface FacturapiPacProviderOptions extends Pick<FacturapiConfig, 'apiKey' | 'baseUrl'> {
  readonly fetch: HttpFetch;
}

export class FacturapiPacProvider implements PacProvider {
  readonly #options: FacturapiPacProviderOptions;

  constructor(options: FacturapiPacProviderOptions) {
    this.#options = options;
  }

  async stampInvoice(request: StampInvoiceRequest): Promise<StampedCfdi> {
    return toStamped(await this.#json('POST', '/invoices', invoiceBody(request)));
  }

  async stampGlobalInvoice(request: StampGlobalInvoiceRequest): Promise<StampedCfdi> {
    return toStamped(await this.#json('POST', '/invoices', globalBody(request)));
  }

  async stampPaymentComplement(request: StampPaymentComplementRequest): Promise<StampedCfdi> {
    return toStamped(await this.#json('POST', '/invoices', complementBody(request)));
  }

  async stampCreditNote(request: StampCreditNoteRequest): Promise<StampedCfdi> {
    return toStamped(await this.#json('POST', '/invoices', creditNoteBody(request)));
  }

  async cancel(request: CancelCfdiRequest): Promise<CancellationStatus> {
    let query = `motive=${request.motivo}`;
    if (request.folioSustitucion) {
      query += `&substitution=${encodeURIComponent(request.folioSustitucion)}`;
    }
    const path = `/invoices/${encodeURIComponent(request.providerId)}?${query}`;
    return toCancellationStatus(await this.#json('DELETE', path));
  }

  async getPdf(providerId: string): Promise<Uint8Array> {
    return this.#bytes(`/invoices/${encodeURIComponent(providerId)}/pdf`);
  }

  async getXml(providerId: string): Promise<Uint8Array> {
    return this.#bytes(`/invoices/${encodeURIComponent(providerId)}/xml`);
  }

  #init(method: HttpRequestInit['method'], body?: unknown): HttpRequestInit {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.#options.apiKey}`,
      'Accept-Language': 'es',
    };
    if (body === undefined) return { method, headers };
    headers['Content-Type'] = 'application/json';
    return { method, headers, body: JSON.stringify(body) };
  }

  async #json(method: HttpRequestInit['method'], path: string, body?: unknown): Promise<unknown> {
    const response = await send(
      this.#options.fetch,
      this.#options.baseUrl + path,
      this.#init(method, body),
    );
    try {
      return await response.json();
    } catch {
      return null; // toStamped / toCancellationStatus reject it as unexpected
    }
  }

  async #bytes(path: string): Promise<Uint8Array> {
    const response = await send(
      this.#options.fetch,
      this.#options.baseUrl + path,
      this.#init('GET'),
    );
    return new Uint8Array(await response.arrayBuffer());
  }
}
