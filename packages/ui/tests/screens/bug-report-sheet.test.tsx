import { describe, expect, it, vi } from 'vitest';

import { BugReportSheet } from '../../src/screens/Settings/bug-report-sheet';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

const logStore = {
  exportSnapshot: vi.fn(async () => ({
    exportedAt: '',
    deviceId: 'd',
    auditEvents: [],
    errors: [],
  })),
};
vi.mock('../../src/observability/observability-provider', () => ({
  useLogStore: () => logStore,
}));

/**
 * The bug-report sheet's presentation (the submit hook has its own suite):
 * consent decides which door is primary — remote when consented and wired,
 * share-as-file otherwise and always as the fallback — an empty description
 * disables every door, and a closed sheet renders nothing at all.
 */

function montar(over: Record<string, unknown> = {}) {
  const onShare = vi.fn();
  const onClose = vi.fn();
  const remote = over.remote ?? null;
  renderWithProviders(
    <BugReportSheet
      visible={true}
      onClose={onClose}
      onShare={onShare}
      consentEnabled={(over.consentEnabled ?? false) as boolean}
      remote={remote}
      {...over}
    />,
  );
  return { onShare, onClose };
}

function escribir(texto: string): void {
  fireEvent.change(screen.getByTestId('bug-report-description-input'), {
    target: { value: texto },
  });
}

describe('BugReportSheet', () => {
  it('an empty description disables every door, and typing opens them', () => {
    montar();
    expect(screen.getByTestId('bug-report-share-btn')).toBeDisabled();
    escribir('No guarda el ticket');
    expect(screen.getByTestId('bug-report-share-btn')).toBeEnabled();
  });

  it('without consent, sharing is the only door — no remote, no fallback row', () => {
    montar({ consentEnabled: false, remote: { sendBugReport: vi.fn() } });
    expect(screen.getByTestId('bug-report-share-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('bug-report-submit-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bug-report-share-fallback-btn')).not.toBeInTheDocument();
  });

  it('with consent and a remote, sending is primary and sharing the fallback', () => {
    montar({ consentEnabled: true, remote: { sendBugReport: vi.fn() } });
    expect(screen.getByTestId('bug-report-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('bug-report-share-fallback-btn')).toBeInTheDocument();
  });

  it('with consent but no remote, sharing is the door again', () => {
    montar({ consentEnabled: true, remote: null });
    expect(screen.getByTestId('bug-report-share-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('bug-report-submit-btn')).not.toBeInTheDocument();
  });

  it('closing the sheet renders nothing', () => {
    montar({ visible: false });
    expect(screen.queryByTestId('bug-report-sheet')).not.toBeInTheDocument();
  });

  it('the header close and Cancelar both close', () => {
    const { onClose } = montar();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
