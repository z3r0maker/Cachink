import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

/**
 * The Asesor's model boundary (P-30, ADR-056) — the **single module** that
 * knows a model exists. Everything else in the Asesor computes figures with
 * `@xangarro/domain` and hands them here as data; the model never derives a
 * number, and a figure is never computed twice by two paths.
 *
 * Gated by two env vars, so the three deployments stay honest:
 *
 * - **Unset** (CI, a fresh clone, production before the credential): the
 *   module answers `null` and the callers stay on their recorded fixtures —
 *   P-30's "local development runs on recorded fixtures" and the ADR-059
 *   production «Próximamente» gate, unchanged.
 * - **Set** (localhost via the cliproxyapi proxy, later Vercel via Azure AI
 *   Foundry): `ASESOR_LLM_BASE_URL` + `ASESOR_LLM_API_KEY` point the Anthropic
 *   SDK at whichever gateway owns the credential. The Foundry credentials the
 *   owner is obtaining land in the same two vars — no code change.
 *
 * The model id is env-overridable (`ASESOR_LLM_MODEL`) because ADR-056 names
 * `claude-opus-5` while the local proxy today serves the opus 4.x line; the
 * default tracks ADR-056 and a proxy that has not caught up overrides it.
 */

const MODELO_POR_DEFECTO = 'claude-opus-5';

/** The env the boundary reads — a seam tests can pin, ProcessEnv-compatible. */
export type LlmEnv = {
  readonly [K in 'ASESOR_LLM_BASE_URL' | 'ASESOR_LLM_API_KEY' | 'ASESOR_LLM_MODEL']?: string;
};

/**
 * The one client, or `null` when the credential is absent. Constructing the
 * client sends nothing — the credential is only used at call time.
 */
export function clienteModelo(env: LlmEnv = process.env as LlmEnv): Anthropic | null {
  const url = env.ASESOR_LLM_BASE_URL;
  const key = env.ASESOR_LLM_API_KEY;
  if (url === undefined || url === '' || key === undefined || key === '') return null;
  return new Anthropic({ baseURL: url, apiKey: key });
}

/** The model id the caller should request. */
export function modeloId(env: LlmEnv = process.env as LlmEnv): string {
  return env.ASESOR_LLM_MODEL ?? MODELO_POR_DEFECTO;
}

/** Whether the live path is configured — the gates' one question. */
export function modelConfigurado(env: LlmEnv = process.env as LlmEnv): boolean {
  return clienteModelo(env) !== null;
}

/**
 * One message round-trip, typed for the Asesor's single shape: figures in,
 * prose out. Every prompt-injection constraint (tenant strings are data) is
 * the caller's; this boundary only refuses an absent credential, so the
 * fixtures path and the live path share one contract.
 */
export async function pedirProsa(
  cliente: Anthropic,
  model: string,
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string> {
  const respuesta = await cliente.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const bloque = respuesta.content[0];
  return bloque !== undefined && bloque.type === 'text' ? bloque.text : '';
}
