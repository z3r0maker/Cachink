import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { accessLines, actAndRecord, seedRunTenant, type Common } from '../runner/act';
import { PHONE_TOOLS, PHONE_SERVER } from '../runner/tools';
import { runId, type Run } from '../schemas/run';
import type { RunAccess } from '../seed/seed';
import { assertLocalUrl } from '../stack/hosts';
import { PhoneCapture } from './capture';
import { Device } from './device';
import { holdsMaestroLock } from './lock';
import { startMetro, type Metro } from './metro';

/**
 * The phone runner (S-06): the capture app on the corrida's Android emulator,
 * wiped, bundled by its own Metro against the corrida's portal, linked with a
 * code minted for this run and signed in as the run's operator by Synth's
 * door flow; then the actor drives it through the Synth proxy in front of
 * Maestro MCP. Success is the same SQL as the web's, given longer for the
 * phone's outbox to push.
 */
const run = promisify(execFile);
const PROXY_MAIN = fileURLToPath(new URL('./proxy-main.ts', import.meta.url));
const DOOR_FLOW = 'tools/synth/flows/phone-door.yaml';

export interface PhoneRunInput extends Common {
  readonly corridaDir: string;
  readonly serverPort: number;
  readonly serverLog: string;
  readonly metroPort: number;
}

/** The proxy, started by the actor's `claude -p`, on this device and run folder. */
export function phoneMcpConfig(o: {
  readonly serial: string;
  readonly captureDir: string;
  /** Another Maestro behind the proxy: the isolation probe's null one (S-07). */
  readonly maestro?: { readonly command: string; readonly args: readonly string[] };
}): unknown {
  const tsx = import.meta.resolve('tsx');
  // `--maestro-arg=<value>`: a value that starts with «--» (`--import`) would
  // otherwise read as an option of its own, and the proxy would refuse to start.
  const maestro =
    o.maestro === undefined
      ? []
      : ['--maestro', o.maestro.command, ...o.maestro.args.map((a) => `--maestro-arg=${a}`)];
  return {
    mcpServers: {
      [PHONE_SERVER]: {
        command: process.execPath,
        args: [
          '--import',
          tsx,
          PROXY_MAIN,
          '--device',
          o.serial,
          '--capture',
          o.captureDir,
          ...maestro,
        ],
      },
    },
  };
}

async function walkPhoneDoor(
  repoRoot: string,
  serial: string,
  env: Record<string, string>,
  log: string,
) {
  const vars = Object.entries(env).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
  const out = await run(
    'maestro',
    ['--device', serial, 'test', join(repoRoot, DOOR_FLOW), ...vars],
    {
      maxBuffer: 16 * 1024 * 1024,
    },
  ).catch((e: { stdout?: string; message: string }) => {
    writeFileSync(log, e.stdout ?? e.message);
    throw new Error(`the phone door did not open; see ${log}`);
  });
  writeFileSync(log, out.stdout);
}

interface Ready {
  readonly id: string;
  readonly dir: string;
  readonly startedAt: Date;
  readonly device: Device;
  readonly access: RunAccess;
  readonly door: Record<string, string>;
  readonly metro: Metro;
}

/** The device wiped and on the persona's network, the run's tenant, and Metro bundling for it. */
async function prepare(i: PhoneRunInput): Promise<Ready> {
  if (!holdsMaestroLock())
    throw new Error('a phone run holds the machine-wide Maestro lock (phone/lock.ts)');
  const avd = i.config.android?.avd;
  if (avd === undefined) throw new Error('config.yaml names no android.avd for the phone runner');
  const id = runId({
    persona: i.persona.id,
    scenario: i.scenario.id,
    style: 'task',
    repetition: i.repetition,
  });
  const dir = join(i.corridaDir, 'runs', id);
  mkdirSync(dir, { recursive: true });
  const startedAt = new Date();
  const device = await Device.find(avd);
  if (!(await device.hasApp()))
    throw new Error(`the capture app's dev client is not installed on ${device.serial}`);
  const access = await seedRunTenant(i, dir);
  const [op] = access.operators;
  if (op === undefined || access.activationCode === null)
    throw new Error('a phone scenario needs an operator and a code');
  const apiBase = `http://10.0.2.2:${i.serverPort}`;
  assertLocalUrl(apiBase, i.config.allowed_hosts);
  await device.wipeApp();
  await device.setNetwork(i.persona.device.network);
  const metro = await startMetro({
    repoRoot: i.repoRoot,
    port: i.metroPort,
    apiBase,
    logFile: join(dir, 'metro.log'),
  });
  const door = {
    EMAIL: access.tenant.email,
    CODE: access.activationCode,
    OPERATOR_ID: op.id,
    NIP: op.nip,
  };
  return { id, dir, startedAt, device, access, door, metro };
}

export async function runPhone(i: PhoneRunInput): Promise<Run> {
  const r = await prepare(i);
  const capture = new PhoneCapture(r.dir, r.device, i.serverLog, r.access.tenant.biz);
  const empty = mkdtempSync(join(tmpdir(), 'synth-actor-'));
  try {
    await r.device.openDevClient(r.metro.url);
    await capture.start();
    await walkPhoneDoor(i.repoRoot, r.device.serial, r.door, join(r.dir, 'door.log'));
    return await actAndRecord({
      ...i,
      runner: 'phone',
      id: r.id,
      dir: r.dir,
      empty,
      startedAt: r.startedAt,
      biz: r.access.tenant.biz,
      access: accessLines(i.scenario, r.access),
      mcpConfig: phoneMcpConfig({ serial: r.device.serial, captureDir: r.dir }),
      tools: PHONE_TOOLS,
      step: (n, action) => capture.step(n, action),
      successWaitMs: 120_000,
    });
  } finally {
    capture.stop();
    r.metro.stop();
    await r.device.setNetwork('wifi').catch(() => undefined);
    rmSync(empty, { recursive: true, force: true });
  }
}
