import { useState, useEffect, useRef } from 'react';
import { useAppStore, isPledgeComplete } from '../store/appStore';
import { PageHeader } from '../components';
import styles from './PledgePage.module.css';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getChecklistDates(startDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < 5; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
  }
  return dates;
}

export default function PledgePage() {
  const pledge = useAppStore((state) => state.pledge);
  const name = useAppStore((state) => state.onboarding.name);
  const setPledge = useAppStore((state) => state.setPledge);
  const togglePledgeDay = useAppStore((state) => state.togglePledgeDay);
  const resetPledge = useAppStore((state) => state.resetPledge);
  const restartPledge = useAppStore((state) => state.restartPledge);

  const isComplete = pledge ? isPledgeComplete(pledge) : false;
  const completedCount = pledge ? pledge.checklist.filter(Boolean).length : 0;
  const currentDay = isComplete ? 5 : Math.min(5, Math.max(1, completedCount + 1));

  // Form state for creating a new pledge
  const [formData, setFormData] = useState({
    why1: '',
    why2: '',
    why3: '',
    reward: '',
    consequence: '',
    action1: '',
    action2: '',
    action3: '',
  });

  // Celebration animation state
  const [showCelebration, setShowCelebration] = useState(false);
  const wasCompleteRef = useRef(isComplete);

  // Track completion for animation
  useEffect(() => {
    let timeoutId: number | undefined;
    if (isComplete && !wasCompleteRef.current) {
      setShowCelebration(true);
      timeoutId = window.setTimeout(() => setShowCelebration(false), 2500);
    }
    wasCompleteRef.current = isComplete;
    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isComplete]);

  const checklistDates = pledge ? getChecklistDates(pledge.startDate) : [];

  const handleCreatePledge = () => {
    const today = new Date().toISOString().split('T')[0];
    setPledge({
      signatureName: name || 'Anonymous',
      startDate: today,
      importantBecauseLines: [formData.why1, formData.why2, formData.why3].filter(Boolean),
      reward: formData.reward,
      consequence: formData.consequence,
      ensureActions: [formData.action1, formData.action2, formData.action3].filter(Boolean),
    });
  };

  const isFormValid = formData.why1 && formData.reward && formData.consequence;

  // No pledge: show creation form
  if (!pledge) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Make a Pledge"
          subtitle="A 5-day commitment to yourself"
        />

        <div className={`${styles.createCard} animate-fade-up`}>
          {/* Intro */}
          <div className={styles.createIntro}>
            <div className={styles.createIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <p className={styles.createText}>
              A pledge is a promise you make to yourself.
              <br />
              Define what matters, what you'll earn, and what you'll lose.
              <br />
              Then show up for 5 days straight.
            </p>
          </div>

          {/* Form */}
          <div className={styles.formSection}>
            <h3 className={styles.formLabel}>
              <span className={styles.formNumber}>1</span>
              This matters to me because...
            </h3>
            <p className={styles.formHint}>Write 1-3 reasons why this commitment is important</p>
            <div className={styles.formInputs}>
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="I want to..."
                value={formData.why1}
                onChange={(e) => setFormData({ ...formData, why1: e.target.value })}
              />
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="It will help me..."
                value={formData.why2}
                onChange={(e) => setFormData({ ...formData, why2: e.target.value })}
              />
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="I'll feel..."
                value={formData.why3}
                onChange={(e) => setFormData({ ...formData, why3: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.formLabel}>
              <span className={styles.formNumber}>2</span>
              If I succeed, I earn...
            </h3>
            <p className={styles.formHint}>Your reward for completing all 5 days</p>
            <input
              type="text"
              className={`${styles.handwrittenInput} ${styles.rewardInput}`}
              placeholder="A guilt-free movie night..."
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
            />
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.formLabel}>
              <span className={styles.formNumber}>3</span>
              If I fail, I lose...
            </h3>
            <p className={styles.formHint}>A meaningful consequence (something you'd actually do)</p>
            <input
              type="text"
              className={`${styles.handwrittenInput} ${styles.consequenceInput}`}
              placeholder="No social media for a week..."
              value={formData.consequence}
              onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
            />
          </div>

          <div className={styles.formSection}>
            <h3 className={styles.formLabel}>
              <span className={styles.formNumber}>4</span>
              To ensure success, I will...
            </h3>
            <p className={styles.formHint}>Optional: specific actions you'll take</p>
            <div className={styles.formInputs}>
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="Wake up 30 minutes earlier..."
                value={formData.action1}
                onChange={(e) => setFormData({ ...formData, action1: e.target.value })}
              />
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="Turn off notifications..."
                value={formData.action2}
                onChange={(e) => setFormData({ ...formData, action2: e.target.value })}
              />
              <input
                type="text"
                className={styles.handwrittenInput}
                placeholder="Tell a friend about my goal..."
                value={formData.action3}
                onChange={(e) => setFormData({ ...formData, action3: e.target.value })}
              />
            </div>
          </div>

          {/* Submit */}
          <div className={styles.formActions}>
            <button
              className={styles.pledgeBtn}
              onClick={handleCreatePledge}
              disabled={!isFormValid}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              I Pledge to This
            </button>
            {!isFormValid && (
              <p className={styles.formError}>Please fill in at least one reason, your reward, and consequence</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pledge exists: show tracking view
  return (
    <div className={styles.page}>
      <PageHeader
        title="Your Pledge"
        subtitle={`Started ${formatDate(pledge.startDate)}`}
      />

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className={styles.celebration}>
          <div className={styles.celebrationContent}>
            <div className={styles.celebrationIcon}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
              </svg>
            </div>
            <h2 className={styles.celebrationTitle}>Pledge Complete!</h2>
            <p className={styles.celebrationText}>You did it! Time to claim your reward.</p>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={`${styles.statusBanner} ${isComplete ? styles.statusComplete : styles.statusActive} animate-fade-up`}>
        <div className={styles.statusIcon}>
          {isComplete ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
        </div>
        <div className={styles.statusText}>
          <span className={styles.statusLabel}>
            {isComplete ? 'Pledge Complete!' : `Day ${currentDay} of 5`}
          </span>
          <span className={styles.statusHint}>
            {isComplete ? 'Claim your reward below' : 'Keep showing up!'}
          </span>
        </div>
        {isComplete && (
          <div className={styles.statusActions}>
            <button className={styles.restartBtn} onClick={restartPledge}>
              Restart Pledge
            </button>
          </div>
        )}
      </div>

      {/* Reward Card (shown when complete) */}
      {isComplete && (
        <div className={`${styles.rewardCard} animate-fade-up`}>
          <div className={styles.rewardIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div className={styles.rewardContent}>
            <span className={styles.rewardLabel}>Your Reward</span>
            <span className={styles.rewardValue}>{pledge.reward}</span>
          </div>
        </div>
      )}

      {/* 5-Day Checklist */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-1`}>
        <h3 className={styles.sectionTitle}>5-Day Checklist</h3>
        <div className={styles.checklist}>
          {pledge.checklist.map((done, idx) => (
            <button
              key={idx}
              className={`${styles.checkDay} ${done ? styles.checkDayDone : ''}`}
              onClick={() => togglePledgeDay(idx)}
              aria-pressed={done}
            >
              <span className={styles.checkDayDate}>{checklistDates[idx]}</span>
              <span className={styles.checkDayNumber}>Day {idx + 1}</span>
              <span className={styles.checkDayIcon}>
                {done ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Why This Matters */}
      <section className={`${styles.section} animate-stagger animate-fade-up delay-2`}>
        <h3 className={styles.sectionTitle}>Why This Matters</h3>
        <div className={styles.whyCard}>
          {pledge.importantBecauseLines.filter(Boolean).map((line, idx) => (
            <p key={idx} className={styles.whyLine}>{line}</p>
          ))}
        </div>
      </section>

      {/* Stakes */}
      <section className={`${styles.stakesGrid} animate-stagger animate-fade-up delay-3`}>
        <div className={`${styles.stakeCard} ${styles.stakeReward}`}>
          <div className={styles.stakeHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            <span className={styles.stakeLabel}>If I succeed</span>
          </div>
          <p className={styles.stakeValue}>{pledge.reward}</p>
        </div>
        <div className={`${styles.stakeCard} ${styles.stakeConsequence}`}>
          <div className={styles.stakeHeader}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className={styles.stakeLabel}>If I fail</span>
          </div>
          <p className={styles.stakeValue}>{pledge.consequence}</p>
        </div>
      </section>

      {/* Actions */}
      {pledge.ensureActions && pledge.ensureActions.filter(Boolean).length > 0 && (
        <section className={`${styles.section} animate-stagger animate-fade-up delay-4`}>
          <h3 className={styles.sectionTitle}>My Success Actions</h3>
          <div className={styles.actionsCard}>
            {pledge.ensureActions.filter(Boolean).map((action, idx) => (
              <div key={idx} className={styles.actionRow}>
                <span className={styles.actionNumber}>{idx + 1}</span>
                <span className={styles.actionText}>{action}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Signature */}
      <div className={`${styles.signature} animate-stagger animate-fade-up delay-5`}>
        <span className={styles.signatureLabel}>Pledged by</span>
        <span className={styles.signatureName}>{pledge.signatureName}</span>
        <span className={styles.signatureDate}>{formatDate(pledge.createdAt)}</span>
      </div>

      {/* Delete Pledge */}
      <div className={`${styles.dangerSection} animate-stagger animate-fade-up delay-5`}>
        <button className={styles.deletePledgeBtn} onClick={resetPledge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Delete Pledge
        </button>
      </div>
    </div>
  );
}
