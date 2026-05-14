/**
 * Wizard — first-run setup picker (ADR-039 four-screen state machine).
 *
 * Reads the active step from `useWizardStore` and renders the matching
 * screen. The store resets on mount so re-runs from Settings start at
 * Step 1. Cloud sub-flow integration is intentionally minimal — once
 * the user picks a cloud branch the orchestrator fires
 * `onSelectMode('cloud')` and the shell's CloudGate takes over with the
 * sign-in/sign-up UI (see ARCHITECTURE.md §"ADR-039").
 */

import { useEffect, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import type { AppMode } from '../../app-config/index';
import {
  useWizardBack,
  useWizardGoTo,
  useWizardPreselect,
  useWizardPreselectedScenario,
  useWizardReset,
  useWizardStep,
  type WizardScenario,
} from './state';
import { Step1WelcomeScreen } from './step1-welcome';
import { Step2aSoloScreen } from './step2a-solo';
import { Step2bMultiScreen } from './step2b-multi';
import { Step3JoinExistingScreen } from './step3-join-existing';
import { StepConsent } from './step-consent';
import { HelpModal } from './help-modal';
import { MigrationDeferredScreen } from './migration-deferred-screen';

type Platform = 'mobile' | 'desktop';

/**
 * @deprecated since ADR-039 — kept as an empty alias for one release to
 * avoid breaking unrelated app-shell call-sites mid-migration.
 */
export interface WizardSelectOptions {
  readonly lanRole?: 'host' | 'client';
}

export interface WizardProps {
  readonly onSelectMode: (mode: AppMode) => void;
  readonly platform?: Platform;
  readonly testID?: string;
  readonly onHelpOpened?: () => void;
}

interface ScreenProps {
  readonly platform: Platform;
  readonly onSelectMode: (mode: AppMode) => void;
  readonly onOpenHelp: () => void;
  readonly onConsent?: (choice: boolean | null) => void;
}

function Step1View({ platform, onOpenHelp }: ScreenProps): ReactElement {
  const goTo = useWizardGoTo();
  const preselected = useWizardPreselectedScenario();
  return (
    <Step1WelcomeScreen
      platform={platform}
      preselectedScenario={preselected}
      onSelectSolo={() => goTo('step2a')}
      onSelectMulti={() => goTo('step2b')}
      onJoinExistingLink={() => goTo('step3')}
      onHelpLink={onOpenHelp}
    />
  );
}

function Step2aView({ onSelectMode }: ScreenProps): ReactElement {
  const back = useWizardBack();
  const goTo = useWizardGoTo();
  return (
    <Step2aSoloScreen
      onSelectLocal={() => onSelectMode('local')}
      onSelectCloud={() => goTo('cloudSignUp')}
      onBack={back}
    />
  );
}

function Step2bView({ platform, onSelectMode }: ScreenProps): ReactElement {
  const back = useWizardBack();
  const goTo = useWizardGoTo();
  return (
    <Step2bMultiScreen
      platform={platform}
      onSelectLanServer={() => onSelectMode('lan-server')}
      onSelectCloud={() => goTo('cloudSignUp')}
      onImportLink={() => goTo('migrationDeferred')}
      onBack={back}
    />
  );
}

function Step3View({ onSelectMode }: ScreenProps): ReactElement {
  const back = useWizardBack();
  const goTo = useWizardGoTo();
  return (
    <Step3JoinExistingScreen
      onSelectLanClient={() => onSelectMode('lan-client')}
      onSelectCloudSignIn={() => goTo('cloudSignIn')}
      onBack={back}
    />
  );
}

function CloudHandoff({ onSelectMode }: { onSelectMode: (mode: AppMode) => void }): ReactElement {
  // The wizard hands over to `<CloudGate>` once mode='cloud' is written —
  // CloudOnboardingScreen owns the sign-in/sign-up UI. Render null while
  // the shell transitions.
  useEffect(() => {
    onSelectMode('cloud');
  }, [onSelectMode]);
  return <></>;
}

function ActiveStep(props: ScreenProps): ReactElement {
  const step = useWizardStep();
  switch (step) {
    case 'step1':
      return <Step1View {...props} />;
    case 'step2a':
      return <Step2aView {...props} />;
    case 'step2b':
      return <Step2bView {...props} />;
    case 'step3':
      return <Step3View {...props} />;
    case 'cloudSignUp':
    case 'cloudSignIn':
      return <CloudHandoff onSelectMode={props.onSelectMode} />;
    case 'migrationDeferred':
      return <MigrationDeferredFromBack />;
    case 'consent':
      return <StepConsent onComplete={props.onConsent ?? (() => {})} />;
    default:
      return <Step1View {...props} />;
  }
}

function MigrationDeferredFromBack(): ReactElement {
  const back = useWizardBack();
  return <MigrationDeferredScreen onBack={back} />;
}

function useHelpModalController(onHelpOpened?: () => void): {
  open: boolean;
  setOpen: (v: boolean) => void;
  pickScenario: (s: WizardScenario) => void;
} {
  const preselect = useWizardPreselect();
  const goTo = useWizardGoTo();
  const [open, setOpenInternal] = useState(false);
  const setOpen = (v: boolean): void => {
    if (v && onHelpOpened) onHelpOpened();
    setOpenInternal(v);
  };
  const pickScenario = (s: WizardScenario): void => {
    preselect(s);
    goTo(s === 'multi-device' ? 'step2b' : 'step2a');
  };
  return { open, setOpen, pickScenario };
}

/**
 * Audit M-1 PR 6: consent flow is intercepted here — instead of calling
 * `onSelectMode` directly, mode selection navigates to the consent step.
 * After the user chooses, we call through to the real `onSelectMode`.
 */
function useConsentIntercept(onSelectMode: (mode: AppMode) => void): {
  pendingMode: AppMode | null;
  interceptedSelectMode: (mode: AppMode) => void;
  handleConsent: (choice: boolean | null) => void;
} {
  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);
  const goTo = useWizardGoTo();

  const interceptedSelectMode = (mode: AppMode): void => {
    setPendingMode(mode);
    goTo('consent');
  };

  const handleConsent = (_choice: boolean | null): void => {
    // Persist consent (parent's TelemetryBridge handles this via
    // the app-config store). For now we just pass through.
    if (pendingMode) {
      onSelectMode(pendingMode);
    }
  };

  return { pendingMode, interceptedSelectMode, handleConsent };
}

export function Wizard(props: WizardProps): ReactElement {
  const platform = props.platform ?? 'desktop';
  const reset = useWizardReset();
  useEffect(() => {
    reset();
  }, [reset]);
  const help = useHelpModalController(props.onHelpOpened);
  const consent = useConsentIntercept(props.onSelectMode);
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'wizard'}>
      <View flex={1} alignItems="center" justifyContent="center" padding={24} gap={14}>
        <SafeAreaSpacer />
        <ActiveStep
          platform={platform}
          onSelectMode={consent.interceptedSelectMode}
          onOpenHelp={() => help.setOpen(true)}
          onConsent={consent.handleConsent}
        />
        <HelpModal
          open={help.open}
          onClose={() => help.setOpen(false)}
          onPick={help.pickScenario}
        />
      </View>
    </FloatingCoinsBackground>
  );
}
