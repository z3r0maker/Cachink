import type { Persona } from '../schemas/persona';

/**
 * The actor's system prompt (`tools/synth/prompts/actor-task.md`), with the
 * persona written as the persona would know itself: what it runs, wants,
 * knows and does not understand, how it behaves and when it gives up. Its id,
 * status, market weight and sources are the harness's, never the actor's.
 */
const list = (xs: readonly string[]): string => xs.join(', ');

function describePersona(p: Persona): string {
  const b = p.business;
  return [
    `- Tu negocio: ${b.type} (${b.team === 'solo' ? 'lo atiendes tú' : b.team}, ${b.formality})`,
    `- Quieres: ${list(p.goals)}`,
    `- Sabes: ${list(p.knows)}`,
    `- No entiendes: ${list(p.does_not_know)}`,
    `- Te comparas con: ${list(p.comparators)}`,
    `- Así eres: ${p.behaviors.map((x) => x.trait).join('; ')}`,
    `- Te rindes si: ${list(p.patience.abandon_triggers)}`,
  ].join('\n');
}

export function renderActorPrompt(
  template: string,
  persona: Persona,
  access: readonly string[],
  maxSteps: number,
): string {
  const values: Readonly<Record<string, string>> = {
    persona: describePersona(persona),
    access:
      access.length === 0 ? '- Nada más que tu celular.' : access.map((a) => `- ${a}`).join('\n'),
    max_steps: String(maxSteps),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined)
      throw new Error(`the actor prompt has a placeholder nobody fills: {{${key}}}`);
    return value;
  });
}
