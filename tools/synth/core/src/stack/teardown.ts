/**
 * What a stack undoes when it ends, however it ends: steps run newest first
 * (the server before the database it talks to), every one is tried even when
 * an earlier one fails, and the whole pass happens once, however many times a
 * signal, a failure and `stop()` ask for it.
 */
export interface TeardownFailure {
  readonly step: string;
  readonly error: string;
}

export class Teardown {
  private readonly steps: { readonly name: string; readonly run: () => Promise<void> }[] = [];
  private pass: Promise<TeardownFailure[]> | undefined;

  add(name: string, run: () => Promise<void>): void {
    this.steps.push({ name, run });
  }

  run(): Promise<TeardownFailure[]> {
    this.pass ??= this.runOnce();
    return this.pass;
  }

  private async runOnce(): Promise<TeardownFailure[]> {
    const failures: TeardownFailure[] = [];
    for (const step of [...this.steps].reverse()) {
      try {
        await step.run();
      } catch (e) {
        failures.push({ step: step.name, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return failures;
  }
}
