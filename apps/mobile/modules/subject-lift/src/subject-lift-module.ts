/**
 * The native half, when this build has it. Web and a build without the
 * module get `null`, and `liftSubject` answers with the photo untouched.
 */
import { requireOptionalNativeModule } from 'expo';
import type { SubjectLiftNative } from './subject-lift.types';

export default requireOptionalNativeModule<SubjectLiftNative>('SubjectLift');
