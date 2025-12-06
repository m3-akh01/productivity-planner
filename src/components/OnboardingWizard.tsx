import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { getGreeting } from '../core/greetings';
import type { ThemeId } from '../store/types';
import styles from './OnboardingWizard.module.css';

type Step = 'name' | 'preferences' | 'pledge';

const steps: Step[] = ['name', 'preferences', 'pledge'];

function getTimePeriod(hour: number): string {
  if (hour >= 0 && hour <= 4) return 'Night Owl';
  if (hour >= 5 && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 16) return 'Afternoon';
  if (hour >= 17 && hour <= 20) return 'Evening';
  return 'Late Evening';
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className={styles.stepIndicator}>
      {steps.map((step, index) => (
        <div
          key={step}
          className={`${styles.stepDot} ${
            steps.indexOf(currentStep) >= index ? styles.stepDotActive : ''
          }`}
        >
          <span className={styles.stepNumber}>{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function NameStep({
  name,
  onNameChange,
  onNext,
}: {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}) {
  const [currentHour] = useState(() => new Date().getHours());
  const timePeriod = getTimePeriod(currentHour);

  // Generate sample greetings for different times of day
  const sampleTimes = [
    { hour: 8, label: 'Morning' },
    { hour: 14, label: 'Afternoon' },
    { hour: 18, label: 'Evening' },
    { hour: 2, label: 'Night Owl' },
  ];

  const displayName = name.trim() || 'friend';

  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>What's your name?</h2>
        <p className={styles.stepDescription}>
          We'll personalize your greetings based on the time of day.
        </p>
      </div>

      <div className={styles.inputGroup}>
        <label htmlFor="name-input">Your Name</label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          autoComplete="given-name"
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onNext()}
        />
      </div>

      {/* Live Greeting Preview */}
      <div className={styles.greetingPreview}>
        <span className={styles.previewLabel}>
          <span className={styles.previewDot} />
          Live preview ({timePeriod})
        </span>
        <p className={styles.previewGreeting}>
          {getGreeting(displayName, new Date())}
        </p>
      </div>

      {/* Sample greetings for other times */}
      <div className={styles.greetingSamples}>
        <p className={styles.samplesLabel}>How you'll be greeted throughout the day:</p>
        <div className={styles.samplesGrid}>
          {sampleTimes.map(({ hour, label }) => {
            const sampleDate = new Date();
            sampleDate.setHours(hour, 0, 0, 0);
            return (
              <div key={label} className={styles.sampleCard}>
                <span className={styles.sampleTime}>{label}</span>
                <span className={styles.sampleGreeting}>
                  {getGreeting(displayName, sampleDate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.stepActions}>
        <button
          className={`btn-primary btn-lg ${styles.primaryAction}`}
          onClick={onNext}
          disabled={!name.trim()}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function PreferencesStep({
  preferences,
  onUpdate,
  onNext,
  onBack,
}: {
  preferences: {
    theme: ThemeId;
    weekStartsOn: 'sunday' | 'monday';
    pomodoroMinutes: number;
    breakMinutes: number;
    enforceTaskOrder: boolean;
    soundEnabled: boolean;
  };
  onUpdate: (updates: Partial<typeof preferences>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Your Preferences</h2>
        <p className={styles.stepDescription}>
          Customize how your planner works. You can change these anytime in Settings.
        </p>
      </div>

      <div className={styles.prefsGrid}>
        {/* Theme */}
        <div className={styles.prefCard}>
          <div className={styles.prefInfo}>
            <h4 className={styles.prefTitle}>Theme</h4>
            <p className={styles.prefDesc}>Choose your visual style</p>
          </div>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${
                preferences.theme === 'laduree' ? styles.toggleActive : ''
              }`}
              onClick={() => onUpdate({ theme: 'laduree' })}
            >
              Ladurée
            </button>
            <button
              className={`${styles.toggleBtn} ${
                preferences.theme === 'midnight-editorial' ? styles.toggleActive : ''
              }`}
              onClick={() => onUpdate({ theme: 'midnight-editorial' })}
            >
              Nocturne
            </button>
          </div>
        </div>

        {/* Week Starts On */}
        <div className={styles.prefCard}>
          <div className={styles.prefInfo}>
            <h4 className={styles.prefTitle}>Week starts on</h4>
            <p className={styles.prefDesc}>Choose your week's first day</p>
          </div>
          <div className={styles.toggleGroup}>
            <button
              className={`${styles.toggleBtn} ${
                preferences.weekStartsOn === 'sunday' ? styles.toggleActive : ''
              }`}
              onClick={() => onUpdate({ weekStartsOn: 'sunday' })}
            >
              Sun
            </button>
            <button
              className={`${styles.toggleBtn} ${
                preferences.weekStartsOn === 'monday' ? styles.toggleActive : ''
              }`}
              onClick={() => onUpdate({ weekStartsOn: 'monday' })}
            >
              Mon
            </button>
          </div>
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
                onUpdate({ pomodoroMinutes: Math.max(5, preferences.pomodoroMinutes - 5) })
              }
              aria-label="Decrease"
            >
              -
            </button>
            <span className={styles.stepperValue}>{preferences.pomodoroMinutes}</span>
            <button
              className={styles.stepperBtn}
              onClick={() =>
                onUpdate({ pomodoroMinutes: Math.min(60, preferences.pomodoroMinutes + 5) })
              }
              aria-label="Increase"
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
                onUpdate({ breakMinutes: Math.max(1, preferences.breakMinutes - 1) })
              }
              aria-label="Decrease"
            >
              -
            </button>
            <span className={styles.stepperValue}>{preferences.breakMinutes}</span>
            <button
              className={styles.stepperBtn}
              onClick={() =>
                onUpdate({ breakMinutes: Math.min(30, preferences.breakMinutes + 1) })
              }
              aria-label="Increase"
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
            onClick={() => onUpdate({ enforceTaskOrder: !preferences.enforceTaskOrder })}
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
            onClick={() => onUpdate({ soundEnabled: !preferences.soundEnabled })}
            role="switch"
            aria-checked={preferences.soundEnabled}
          >
            <span className={styles.switchThumb} />
          </button>
        </div>
      </div>

      <div className={styles.stepActions}>
        <button className="btn-ghost" onClick={onBack}>
          Back
        </button>
        <button className={`btn-primary btn-lg ${styles.primaryAction}`} onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
}

function PledgeStep({
  onStartPledge,
  onSkip,
  onBack,
}: {
  onStartPledge: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Make a Pledge</h2>
        <p className={styles.stepDescription}>
          A pledge is a 5-day commitment to yourself. It's optional, but powerful.
        </p>
      </div>

      <div className={styles.pledgeInfo}>
        <div className={styles.pledgeCard}>
          <div className={styles.pledgeIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className={styles.pledgeText}>
            <h4>What's a pledge?</h4>
            <ul>
              <li>Write down your commitment</li>
              <li>Define why it matters to you</li>
              <li>Set a reward and consequence</li>
              <li>Track 5 consecutive days</li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.stepActions}>
        <button className="btn-ghost" onClick={onBack}>
          Back
        </button>
        <button className="btn-secondary btn-lg" onClick={onSkip}>
          Skip for now
        </button>
        <button className={`btn-primary btn-lg ${styles.primaryAction}`} onClick={onStartPledge}>
          Start a Pledge
        </button>
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('name');

  // Local state for wizard (will save to store on completion)
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'laduree' as ThemeId,
    weekStartsOn: 'monday' as 'sunday' | 'monday',
    pomodoroMinutes: 25,
    breakMinutes: 5,
    enforceTaskOrder: false,
    soundEnabled: true,
  });

  const storeSetName = useAppStore((state) => state.setName);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const finishOnboarding = (startPledge: boolean) => {
    // Save to store
    storeSetName(name.trim() || 'friend');
    updatePreferences(preferences);
    completeOnboarding();

    // Navigate
    if (startPledge) {
      navigate('/pledge');
    } else {
      navigate('/');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStep !== 'name') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  return (
    <div className={styles.wizard}>
      <div className={styles.wizardCard}>
        {/* Header */}
        <div className={styles.wizardHeader}>
          <div className={styles.brandMark}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className={styles.wizardTitle}>Productivity Planner</h1>
          <StepIndicator currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className={styles.wizardBody}>
          {currentStep === 'name' && (
            <NameStep name={name} onNameChange={setName} onNext={handleNext} />
          )}
          {currentStep === 'preferences' && (
            <PreferencesStep
              preferences={preferences}
              onUpdate={(updates) => {
                setPreferences((prev) => ({ ...prev, ...updates }));
                if (updates.theme) {
                  updatePreferences({ theme: updates.theme });
                }
              }}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 'pledge' && (
            <PledgeStep
              onStartPledge={() => finishOnboarding(true)}
              onSkip={() => finishOnboarding(false)}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
