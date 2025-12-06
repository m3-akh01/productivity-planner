import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { PageHeader } from '../components';
import styles from './SettingsPage.module.css';

type PreferenceToggleOption<T extends string> = {
  value: T;
  label: string;
  ariaLabel?: string;
};

function PreferenceToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: PreferenceToggleOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.toggleGroup}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.toggleBtn} ${
            value === option.value ? styles.toggleActive : ''
          }`}
          onClick={() => onChange(option.value)}
          aria-label={option.ariaLabel}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const schemaVersion = useAppStore((state) => state.schemaVersion);
  const lastImportedAt = useAppStore((state) => state.lastImportedAt);
  const preferences = useAppStore((state) => state.preferences);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const exportState = useAppStore((state) => state.exportState);
  const importState = useAppStore((state) => state.importState);
  const deleteAllData = useAppStore((state) => state.deleteAllData);

  // Collapsible section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    preferences: true,
    data: false,
    danger: false,
  });

  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleExport = () => {
    const data = exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setPendingImportFile(file);
      setShowImportModal(true);
      setImportError(null);
    };
    input.click();
  };

  const confirmImport = async () => {
    if (!pendingImportFile) return;
    try {
      const text = await pendingImportFile.text();
      importState(text);
      setShowImportModal(false);
      setPendingImportFile(null);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Invalid file format');
    }
  };

  const cancelImport = () => {
    setShowImportModal(false);
    setPendingImportFile(null);
    setImportError(null);
  };

  const handleDeleteAll = () => {
    if (deleteConfirmText !== 'DELETE') return;
    deleteAllData();
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    window.location.reload();
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings"
        subtitle="Preferences and data management"
      />

      {/* Preferences Section */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-1`}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('preferences')}
          aria-expanded={openSections.preferences}
        >
          <div className={styles.sectionHeaderContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <h3 className={styles.sectionTitle}>Preferences</h3>
          </div>
          <svg
            className={`${styles.chevron} ${openSections.preferences ? styles.chevronOpen : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {openSections.preferences && (
          <div className={styles.sectionContent}>
            <div className={styles.prefsGrid}>
              {/* Theme */}
              <div className={styles.prefCard}>
                <div className={styles.prefInfo}>
                  <h4 className={styles.prefTitle}>Theme</h4>
                  <p className={styles.prefDesc}>Choose your visual style</p>
                </div>
                <PreferenceToggleGroup
                  value={preferences.theme}
                  options={[
                    {
                      value: 'laduree',
                      label: 'Ladurée',
                      ariaLabel: 'Use Ladurée theme',
                    },
                    {
                      value: 'nocturne',
                      label: 'Nocturne',
                      ariaLabel: 'Use Nocturne theme',
                    },
                  ]}
                  onChange={(value) => updatePreferences({ theme: value })}
                />
              </div>

              {/* Week Starts On */}
              <div className={styles.prefCard}>
                <div className={styles.prefInfo}>
                  <h4 className={styles.prefTitle}>Week starts on</h4>
                  <p className={styles.prefDesc}>First day of your week</p>
                  <p className={styles.prefNote}>
                    Weekly plans are grouped by this choice. Changing it won’t delete anything but may shift which week older plans appear under.
                  </p>
                </div>
                <PreferenceToggleGroup
                  value={preferences.weekStartsOn}
                  options={[
                    {
                      value: 'sunday',
                      label: 'Sun',
                      ariaLabel: 'Start week on Sunday',
                    },
                    {
                      value: 'monday',
                      label: 'Mon',
                      ariaLabel: 'Start week on Monday',
                    },
                  ]}
                  onChange={(value) => updatePreferences({ weekStartsOn: value })}
                />
              </div>

              {/* Pomodoro Minutes */}
              <div className={styles.prefCard}>
                  <div className={styles.prefInfo}>
                    <h4 className={styles.prefTitle}>Focus duration</h4>
                    <p className={styles.prefDesc}>Minutes per work session</p>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      className={styles.stepperBtn}
                      onClick={() =>
                        updatePreferences({ pomodoroMinutes: Math.max(5, preferences.pomodoroMinutes - 5) })
                      }
                      aria-label="Decrease focus duration"
                    >
                      −
                    </button>
                    <span className={styles.stepperValue}>{preferences.pomodoroMinutes}</span>
                    <button
                      className={styles.stepperBtn}
                      onClick={() =>
                        updatePreferences({ pomodoroMinutes: Math.min(60, preferences.pomodoroMinutes + 5) })
                      }
                      aria-label="Increase focus duration"
                    >
                      +
                    </button>
                  </div>
                </div>

              {/* Break Minutes */}
              <div className={styles.prefCard}>
                  <div className={styles.prefInfo}>
                    <h4 className={styles.prefTitle}>Break duration</h4>
                    <p className={styles.prefDesc}>Minutes between sessions</p>
                  </div>
                  <div className={styles.stepper}>
                    <button
                      className={styles.stepperBtn}
                      onClick={() =>
                        updatePreferences({ breakMinutes: Math.max(1, preferences.breakMinutes - 1) })
                      }
                      aria-label="Decrease break duration"
                    >
                      −
                    </button>
                    <span className={styles.stepperValue}>{preferences.breakMinutes}</span>
                    <button
                      className={styles.stepperBtn}
                      onClick={() =>
                        updatePreferences({ breakMinutes: Math.min(30, preferences.breakMinutes + 1) })
                      }
                      aria-label="Increase break duration"
                    >
                      +
                    </button>
                  </div>
                </div>

              {/* Enforce Task Order */}
              <div className={styles.prefCard}>
                <div className={styles.prefInfo}>
                  <h4 className={styles.prefTitle}>Enforce task order</h4>
                  <p className={styles.prefDesc}>Complete tasks in sequence</p>
                </div>
                <button
                  className={`${styles.switch} ${preferences.enforceTaskOrder ? styles.switchOn : ''}`}
                  onClick={() => updatePreferences({ enforceTaskOrder: !preferences.enforceTaskOrder })}
                  role="switch"
                  aria-checked={preferences.enforceTaskOrder}
                >
                  <span className={styles.switchThumb} />
                </button>
              </div>

              {/* Sound Enabled */}
              <div className={styles.prefCard}>
                <div className={styles.prefInfo}>
                  <h4 className={styles.prefTitle}>Sound notification</h4>
                  <p className={styles.prefDesc}>Play sound when timer ends</p>
                </div>
                <button
                  className={`${styles.switch} ${preferences.soundEnabled ? styles.switchOn : ''}`}
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  role="switch"
                  aria-checked={preferences.soundEnabled}
                >
                  <span className={styles.switchThumb} />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-2`}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection('data')}
          aria-expanded={openSections.data}
        >
          <div className={styles.sectionHeaderContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <h3 className={styles.sectionTitle}>Data Management</h3>
          </div>
          <svg
            className={`${styles.chevron} ${openSections.data ? styles.chevronOpen : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {openSections.data && (
          <div className={styles.sectionContent}>
            <div className={styles.dataCard}>
              <div className={styles.dataInfo}>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Schema version</span>
                  <span className={styles.dataValue}>v{schemaVersion}</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Last imported</span>
                  <span className={styles.dataValue}>{lastImportedAt || 'Never'}</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataLabel}>Storage</span>
                  <span className={styles.dataValue}>localStorage</span>
                </div>
              </div>
              <div className={styles.dataActions}>
                <button className={styles.dataBtn} onClick={handleExport}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export Data
                </button>
                <button className={styles.dataBtn} onClick={handleImportClick}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Import Data
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-3`}>
        <button
          className={`${styles.sectionHeader} ${styles.sectionHeaderDanger}`}
          onClick={() => toggleSection('danger')}
          aria-expanded={openSections.danger}
        >
          <div className={styles.sectionHeaderContent}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h3 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>Danger Zone</h3>
          </div>
          <svg
            className={`${styles.chevron} ${openSections.danger ? styles.chevronOpen : ''}`}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {openSections.danger && (
          <div className={styles.sectionContent}>
            <div className={styles.dangerCard}>
              <div className={styles.dangerInfo}>
                <h4 className={styles.dangerHeading}>Delete all data</h4>
                <p className={styles.dangerDesc}>
                  Permanently remove all your data including tasks, weekly plans, pledges, and preferences.
                  This action cannot be undone.
                </p>
              </div>
              <button
                className={styles.dangerBtn}
                onClick={() => setShowDeleteModal(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Delete Everything
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Import Confirmation Modal */}
      {showImportModal && (
        <div className={styles.modalBackdrop} onClick={cancelImport}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className={styles.modalTitle}>Import Data?</h3>
            <p className={styles.modalText}>
              This will replace all your current data with the imported file.
              Any existing tasks, plans, and settings will be overwritten.
            </p>
            {pendingImportFile && (
              <div className={styles.modalFile}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>{pendingImportFile.name}</span>
              </div>
            )}
            {importError && (
              <div className={styles.modalError}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{importError}</span>
              </div>
            )}
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={cancelImport}>
                Cancel
              </button>
              <button className={styles.modalBtnPrimary} onClick={confirmImport}>
                Import & Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalBackdrop} onClick={cancelDelete}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className={`${styles.modalTitle} ${styles.modalTitleDanger}`}>Delete All Data?</h3>
            <p className={styles.modalText}>
              This will permanently delete all your tasks, weekly plans, pledges, and preferences.
              This action <strong>cannot be undone</strong>.
            </p>
            <div className={styles.deleteConfirm}>
              <label className={styles.deleteConfirmLabel}>
                Type <span className={styles.deleteKeyword}>DELETE</span> to confirm:
              </label>
              <input
                type="text"
                className={styles.deleteConfirmInput}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.modalBtnSecondary} onClick={cancelDelete}>
                Cancel
              </button>
              <button
                className={styles.modalBtnDanger}
                onClick={handleDeleteAll}
                disabled={deleteConfirmText !== 'DELETE'}
              >
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
