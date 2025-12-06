import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import styles from './TimerBubble.module.css';

export function TimerBubble() {
  const timer = useAppStore((state) => state.timer);
  const preferences = useAppStore((state) => state.preferences);
  const openTimer = useAppStore((state) => state.openTimer);
  const closeTimer = useAppStore((state) => state.closeTimer);
  const startGenericWork = useAppStore((state) => state.startGenericWork);
  const startBreak = useAppStore((state) => state.startBreak);
  const pause = useAppStore((state) => state.pause);
  const resume = useAppStore((state) => state.resume);
  const resetTimer = useAppStore((state) => state.resetTimer);

  // Session-only duration overrides
  const [sessionWorkMinutes, setSessionWorkMinutes] = useState(preferences.pomodoroMinutes);
  const [sessionBreakMinutes, setSessionBreakMinutes] = useState(preferences.breakMinutes);
  const [showDurationEdit, setShowDurationEdit] = useState(false);

  // Sync with preferences when idle
  useEffect(() => {
    if (timer.status === 'idle') {
      setSessionWorkMinutes(preferences.pomodoroMinutes);
      setSessionBreakMinutes(preferences.breakMinutes);
    }
  }, [preferences.pomodoroMinutes, preferences.breakMinutes, timer.status]);

  const { status, phase, secondsLeft, uiOpen, lastError, workDurationSeconds, breakDurationSeconds } = timer;

  const isActive = status === 'running' || status === 'paused';

  const effectiveSecondsLeft =
    status === 'idle'
      ? (phase === 'work' ? sessionWorkMinutes * 60 : sessionBreakMinutes * 60)
      : secondsLeft;

  const minutes = Math.floor(effectiveSecondsLeft / 60);
  const seconds = effectiveSecondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress percentage for the ring
  const effectiveWorkTotal =
    typeof workDurationSeconds === 'number' && workDurationSeconds > 0
      ? workDurationSeconds
      : sessionWorkMinutes * 60;
  const effectiveBreakTotal =
    typeof breakDurationSeconds === 'number' && breakDurationSeconds > 0
      ? breakDurationSeconds
      : sessionBreakMinutes * 60;

  const totalSeconds =
    phase === 'work'
      ? effectiveWorkTotal
      : effectiveBreakTotal;

  const progress =
    isActive && totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 26; // radius = 26
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleStartWork = () => {
    startGenericWork({
      workMinutes: sessionWorkMinutes,
      breakMinutes: sessionBreakMinutes,
    });
  };

  const handleStartBreak = () => {
    startBreak({
      breakMinutes: sessionBreakMinutes,
    });
  };

  const handlePauseResume = () => {
    if (status === 'running') {
      pause();
    } else if (status === 'paused') {
      resume();
    }
  };

  const handleReset = () => {
    resetTimer();
    setShowDurationEdit(false);
  };

  const togglePanel = () => {
    if (uiOpen) {
      closeTimer();
    } else {
      openTimer();
    }
  };

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && uiOpen) {
        closeTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiOpen, closeTimer]);

  return (
    <>
      {/* Floating Button */}
      <button
        className={`${styles.bubble} ${status === 'running' ? styles.bubbleRunning : ''} ${phase === 'break' ? styles.bubbleBreak : ''}`}
        onClick={togglePanel}
        aria-label="Toggle timer panel"
        aria-expanded={uiOpen}
      >
        {/* Progress Ring */}
        <svg className={styles.ring} viewBox="0 0 60 60">
          <circle
            className={styles.ringBg}
            cx="30"
            cy="30"
            r="26"
            strokeWidth="4"
            fill="none"
          />
          <circle
            className={styles.ringProgress}
            cx="30"
            cy="30"
            r="26"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ opacity: status !== 'idle' ? 1 : 0 }}
          />
        </svg>

        {/* Icon or Time */}
        <div className={styles.bubbleContent}>
          {status === 'idle' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          ) : (
            <span className={styles.bubbleTime}>{formattedTime}</span>
          )}
        </div>
      </button>

      {/* Overlay Panel */}
      {uiOpen && (
        <>
          <div className={styles.backdrop} onClick={closeTimer} />
          <div className={styles.panel}>
            {/* Header */}
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Timer</h3>
              <button className={styles.closeBtn} onClick={closeTimer} aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Toast */}
            {lastError && (
              <div className={styles.errorToast}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{lastError}</span>
              </div>
            )}

            {/* Time Display */}
            <div className={styles.timeDisplay}>
              <span className={`${styles.time} ${status === 'running' ? styles.timeRunning : ''}`}>
                {formattedTime}
              </span>
              <span className={`${styles.phase} ${phase === 'break' ? styles.phaseBreak : ''}`}>
                {phase === 'work' ? 'Focus Time' : 'Break Time'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${phase === 'break' ? styles.progressBreak : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              {status === 'idle' && (
                <>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStartWork}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Focus
                  </button>
                  <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleStartBreak}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
                    </svg>
                    Take Break
                  </button>
                </>
              )}

              {(status === 'running' || status === 'paused') && (
                <>
                  <button
                    className={`${styles.btn} ${status === 'running' ? styles.btnWarning : styles.btnPrimary}`}
                    onClick={handlePauseResume}
                  >
                    {status === 'running' ? (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="4" width="4" height="16" rx="1" />
                          <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                        Pause
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        Resume
                      </>
                    )}
                  </button>
                  <button className={`${styles.btn} ${styles.btnGhost}`} onClick={handleReset}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* Duration Settings */}
            <div className={styles.durationSection}>
              <button
                className={styles.durationToggle}
                onClick={() => setShowDurationEdit(!showDurationEdit)}
                aria-expanded={showDurationEdit}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Session Settings
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`${styles.chevron} ${showDurationEdit ? styles.chevronOpen : ''}`}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showDurationEdit && (
                <div className={styles.durationEdit}>
                  <p className={styles.durationHint}>Changes apply to this session only</p>
                  <div className={styles.durationFields}>
                    <div className={styles.durationField}>
                      <label>Focus</label>
                      <div className={styles.durationStepper}>
                        <button
                          onClick={() => setSessionWorkMinutes(Math.max(5, sessionWorkMinutes - 5))}
                          disabled={status !== 'idle'}
                          aria-label="Decrease focus minutes for this session"
                        >
                          −
                        </button>
                        <span>{sessionWorkMinutes}m</span>
                        <button
                          onClick={() => setSessionWorkMinutes(Math.min(60, sessionWorkMinutes + 5))}
                          disabled={status !== 'idle'}
                          aria-label="Increase focus minutes for this session"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={styles.durationField}>
                      <label>Break</label>
                      <div className={styles.durationStepper}>
                        <button
                          onClick={() => setSessionBreakMinutes(Math.max(1, sessionBreakMinutes - 1))}
                          disabled={status !== 'idle'}
                          aria-label="Decrease break minutes for this session"
                        >
                          −
                        </button>
                        <span>{sessionBreakMinutes}m</span>
                        <button
                          onClick={() => setSessionBreakMinutes(Math.min(30, sessionBreakMinutes + 1))}
                          disabled={status !== 'idle'}
                          aria-label="Increase break minutes for this session"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </>
  );
}

export default TimerBubble;
