import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';

export default function OnboardingPage() {
  const onboarding = useAppStore((state) => state.onboarding);
  const preferences = useAppStore((state) => state.preferences);
  const pledge = useAppStore((state) => state.pledge);

  const preferenceSummary = useMemo(
    () => [
      `Week starts on: ${preferences.weekStartsOn}`,
      `Pomodoro: ${preferences.pomodoroMinutes} minutes`,
      `Break: ${preferences.breakMinutes} minutes`,
      `Enforce task order: ${preferences.enforceTaskOrder ? 'yes' : 'no'}`,
      `Sound enabled: ${preferences.soundEnabled ? 'yes' : 'no'}`,
    ],
    [preferences],
  );

  return (
    <div className="card">
      <h1>Onboarding</h1>
      <p>
        Wizard captures your name (required), preferences, and optionally your 5-day pledge. UI will
        be built later; state and persistence are in place now.
      </p>
      <ul>
        <li>
          <strong>Status:</strong> {onboarding.onboardingCompleted ? 'Complete' : 'Not complete'}
        </li>
        <li>
          <strong>Name:</strong> {onboarding.name || 'Not set'}
        </li>
        <li>
          <strong>Pledge draft:</strong> {onboarding.pledgeDraft || 'None yet'}
        </li>
        <li>
          <strong>Active pledge:</strong> {pledge ? pledge.text : 'None created'}
        </li>
      </ul>
      <h3>Preference defaults</h3>
      <ul>
        {preferenceSummary.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
