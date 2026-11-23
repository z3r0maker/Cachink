import { BUILT_INS } from '../runner/actor-args';
import type { BugCandidate } from './candidates';
import { vocabularyText } from './keys';

/**
 * How the judge is started (S-08, spec §8.3): `claude -p` in the run folder,
 * with Claude Code's three reading tools and nothing else. `--restricted`
 * confines them to the working directory, so the judge sees the run and never
 * the app's code; no MCP server is loaded.
 */
export const JUDGE_TOOLS = ['Read', 'Glob', 'Grep'] as const;

export function judgeArgs(i: {
  readonly model: string;
  readonly budgetUsd: number;
  readonly systemPrompt: string;
}): string[] {
  if (!(i.budgetUsd > 0))
    throw new Error(`the judge's budget must be a positive amount, not ${i.budgetUsd}`);
  const reading = JUDGE_TOOLS.join(',');
  return [
    '-p',
    '--output-format',
    'stream-json',
    '--verbose',
    '--no-session-persistence',
    '--model',
    i.model,
    '--max-budget-usd',
    String(i.budgetUsd),
    '--restricted',
    '--strict-mcp-config',
    '--tools',
    reading,
    '--allowedTools',
    reading,
    '--disallowedTools',
    BUILT_INS.filter((t) => !(JUDGE_TOOLS as readonly string[]).includes(t)).join(','),
    '--permission-mode',
    'dontAsk',
    '--system-prompt',
    i.systemPrompt,
  ];
}

export interface JudgeInputs {
  /** The run folder's files, relative to it. */
  readonly files: readonly string[];
  readonly outcome: string;
  /** The persona's and scenario's YAML, as written. */
  readonly persona: string;
  readonly scenario: string;
  readonly candidates: readonly BugCandidate[];
}

/** `tools/synth/prompts/judge.md`, filled with the run's own facts. */
export function renderJudgePrompt(template: string, i: JudgeInputs): string {
  const values: Readonly<Record<string, string>> = {
    files: i.files.map((f) => `- \`${f}\``).join('\n'),
    outcome: i.outcome,
    persona: i.persona.trim(),
    scenario: i.scenario.trim(),
    claves: vocabularyText(),
    candidates:
      i.candidates.length === 0
        ? 'Ninguno: la consola y la red no registraron errores.'
        : i.candidates.map((c) => `- ${c.id} · \`${c.ref}\` · ${c.text}`).join('\n'),
  };
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined)
      throw new Error(`the judge prompt has a placeholder nobody fills: {{${key}}}`);
    return value;
  });
}
