/**
 * `subject-lift` — the product photo off its background, on the phone
 * (M-13, ADR-134): Apple Vision's foreground-instance mask on iOS 17, ML Kit
 * Subject Segmentation on Android. Anything that cannot lift returns the
 * centred square crop with `lifted: false`; nothing here blocks a photo.
 */
import SubjectLift from './src/subject-lift-module';
import type { SubjectLiftResult } from './src/subject-lift.types';

export type { SubjectLiftResult } from './src/subject-lift.types';

/** Called once at app start: on Android it requests the segmentation model. */
export async function prepareSubjectLift(): Promise<boolean> {
  if (SubjectLift === null) return false;
  try {
    return await SubjectLift.prepare();
  } catch {
    return false;
  }
}

/**
 * The photo at `uri` lifted, or squared. Without the native module (web)
 * the photo comes back as it is and the encoder crops it square.
 */
export async function liftSubject(uri: string): Promise<SubjectLiftResult> {
  if (SubjectLift === null) return { uri, lifted: false, width: 0, height: 0 };
  return SubjectLift.lift(uri);
}
