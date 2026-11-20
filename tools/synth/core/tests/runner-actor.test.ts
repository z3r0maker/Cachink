import assert from 'node:assert/strict';

import { describe, it } from 'vitest';

import { ACTION_TOOLS, actorArgs, LOOK_TOOLS, mcpConfig, SERVER } from '../src/runner/actor-args';
import { networkConditions } from '../src/runner/network';

/**
 * The actor is a black box (ADR-153 §6): these pin exactly what it is started
 * with, because a flag that drifts is a hole in its isolation. The flags were
 * verified against Claude Code 2.1.283 on 2026-11-19 (see S-05's done note).
 */
describe('actorArgs', () => {
  const args = actorArgs({
    model: 'claude-sonnet-5-5',
    mcpConfigPath: '/run/mcp.json',
    budgetUsd: 2.5,
    systemPrompt: 'SP',
  });
  const after = (flag: string) => args[args.indexOf(flag) + 1];

  it('runs in print mode, streaming JSON, with no session saved', () => {
    for (const f of ['-p', '--verbose', '--no-session-persistence']) assert.ok(args.includes(f), f);
    assert.equal(after('--output-format'), 'stream-json');
    assert.equal(after('--model'), 'claude-sonnet-5-5');
    assert.equal(after('--max-budget-usd'), '2.5');
    assert.equal(after('--system-prompt'), 'SP');
  });

  it('loads only its one MCP server and no settings, hooks or built-in tools', () => {
    for (const f of ['--restricted', '--strict-mcp-config']) assert.ok(args.includes(f), f);
    assert.equal(after('--mcp-config'), '/run/mcp.json');
    assert.equal(after('--tools'), '');
    assert.ok(!args.includes('--safe-mode'), '--safe-mode drops --mcp-config too');
    assert.ok(!args.includes('--bare'), '--bare never reads the Claude Code login');
  });

  it('allows the persona’s tools and nothing else, and denies everything it did not allow', () => {
    assert.equal(after('--permission-mode'), 'dontAsk');
    const allowed = after('--allowedTools')?.split(',') ?? [];
    assert.deepEqual(
      allowed.sort(),
      [...ACTION_TOOLS, ...LOOK_TOOLS].map((t) => `mcp__${SERVER}__browser_${t}`).sort(),
    );
    const denied = after('--disallowedTools')?.split(',') ?? [];
    for (const t of [
      'navigate',
      'evaluate',
      'run_code_unsafe',
      'console_messages',
      'network_requests',
      'tabs',
    ]) {
      assert.ok(denied.includes(`mcp__${SERVER}__browser_${t}`), t);
      assert.ok(!allowed.includes(`mcp__${SERVER}__browser_${t}`), t);
    }
    for (const t of [
      'Read',
      'Write',
      'Edit',
      'Glob',
      'Grep',
      'Bash',
      'WebFetch',
      'WebSearch',
      'Task',
    ]) {
      assert.ok(denied.includes(t), t);
    }
  });

  it('refuses a budget that is not a positive amount', () => {
    for (const budgetUsd of [0, -1, Number.NaN]) {
      assert.throws(
        () => actorArgs({ model: 'm', mcpConfigPath: 'x', budgetUsd, systemPrompt: '' }),
        /budget/,
      );
    }
  });
});

describe('mcpConfig', () => {
  it('starts Playwright MCP on the runner’s browser, by CDP, with service workers blocked', () => {
    const cfg = mcpConfig({ node: '/bin/node', cli: '/v/cli.js', cdpUrl: 'http://127.0.0.1:9333' });
    const server = cfg.mcpServers[SERVER];
    assert.deepEqual(Object.keys(cfg.mcpServers), [SERVER]);
    assert.equal(server?.command, '/bin/node');
    assert.deepEqual(server?.args.slice(0, 3), [
      '/v/cli.js',
      '--cdp-endpoint',
      'http://127.0.0.1:9333',
    ]);
    assert.ok(server?.args.includes('--block-service-workers'));
  });

  it('refuses a CDP endpoint that is not on loopback', () => {
    assert.throws(
      () => mcpConfig({ node: 'n', cli: 'c', cdpUrl: 'http://10.0.0.5:9222' }),
      /loopback/,
    );
  });
});

describe('networkConditions', () => {
  it('leaves wifi unthrottled and slows 4g and slow-3g, slow-3g most', () => {
    assert.equal(networkConditions('wifi'), null);
    const g4 = networkConditions('4g');
    const g3 = networkConditions('slow-3g');
    assert.ok(g4 && g3);
    assert.ok(g3.latency > g4.latency);
    assert.ok(g3.downloadThroughput < g4.downloadThroughput);
    assert.equal(g3.offline, false);
  });

  it('runs «offline-intermitente» on 4g: the cuts are an interruption, scripted (S-12)', () => {
    assert.deepEqual(networkConditions('offline-intermitente'), networkConditions('4g'));
  });
});
