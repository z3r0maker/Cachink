import { execFile, spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';

import type { Persona } from '../schemas/persona';
import { emulatorNetwork, parseAdbDevices } from './signals';

/**
 * The corrida's Android emulator, through adb only (S-06). Maestro drives the
 * app; adb does what a test harness does to a phone between runs: wipe the
 * app, shape the network, open the dev client on Metro, take a screenshot and
 * read logcat. Screenshots go through `screencap`, never `uiautomator`, which
 * would fight Maestro's driver for the one UI automation session.
 */
const run = promisify(execFile);

export const ADB =
  process.env.ANDROID_HOME !== undefined
    ? join(process.env.ANDROID_HOME, 'platform-tools/adb')
    : join(homedir(), 'Library/Android/sdk/platform-tools/adb');

export const APP_ID = 'mx.xangarro.mobile';

async function adb(args: readonly string[]): Promise<string> {
  const { stdout } = await run(ADB, [...args], { maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

export class Device {
  private constructor(readonly serial: string) {}

  /** The running emulator whose AVD is `avd`; refuses when there is none. */
  static async find(avd: string): Promise<Device> {
    for (const serial of parseAdbDevices(await adb(['devices']))) {
      const name = (await adb(['-s', serial, 'emu', 'avd', 'name']).catch(() => ''))
        .split('\n')[0]
        ?.trim();
      if (name === avd) return new Device(serial);
    }
    throw new Error(`no running emulator for AVD «${avd}»: start it with \`emulator -avd ${avd}\``);
  }

  private sh(...args: string[]): Promise<string> {
    return adb(['-s', this.serial, ...args]);
  }

  /** Whether the capture app (a dev client) is installed. */
  async hasApp(): Promise<boolean> {
    return (await this.sh('shell', 'pm', 'list', 'packages', APP_ID)).includes(`package:${APP_ID}`);
  }

  /** Every run starts from a wiped app: no database, no link, no remembered Metro. */
  async wipeApp(): Promise<void> {
    await this.sh('shell', 'pm', 'clear', APP_ID);
  }

  async setNetwork(network: Persona['device']['network']): Promise<void> {
    const n = emulatorNetwork(network);
    await this.sh('emu', 'network', 'speed', n.speed);
    await this.sh('emu', 'network', 'delay', n.delay);
  }

  /** Points the dev client at Metro, as the harness's prime-dev-client does. */
  async openDevClient(metroUrl: string): Promise<void> {
    const link = `exp+xangarro://expo-development-client/?url=${encodeURIComponent(metroUrl)}`;
    await this.sh('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', `'${link}'`);
  }

  async screenshot(file: string): Promise<void> {
    const { stdout } = await run(ADB, ['-s', this.serial, 'exec-out', 'screencap', '-p'], {
      encoding: 'buffer',
      maxBuffer: 32 * 1024 * 1024,
    });
    writeFileSync(file, stdout);
  }

  /** Clears the log, then streams it line by line until the returned stop. */
  async logcat(onLine: (line: string) => void): Promise<() => void> {
    await this.sh('logcat', '-c');
    const child = spawn(ADB, ['-s', this.serial, 'logcat', '-v', 'epoch'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    createInterface({ input: child.stdout }).on('line', onLine);
    return () => child.kill();
  }
}
