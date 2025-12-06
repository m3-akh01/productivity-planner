import { Navigate, Route, Routes } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { usePomodoroEngine } from './hooks/usePomodoroEngine';
import { AppShell, OnboardingWizard } from './components';
import {
  DailyPage,
  PledgePage,
  SettingsPage,
  WeeklyPage,
} from './pages';

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const onboardingCompleted = useAppStore((state) => state.onboarding.onboardingCompleted);

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

function RedirectIfOnboarded({ children }: { children: React.ReactNode }) {
  const onboardingCompleted = useAppStore((state) => state.onboarding.onboardingCompleted);

  if (onboardingCompleted) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  // Activate the pomodoro engine (handles timer ticks and sound)
  usePomodoroEngine();

  return (
    <Routes>
      {/* Onboarding - full screen, no shell */}
      <Route
        path="/onboarding"
        element={
          <RedirectIfOnboarded>
            <OnboardingWizard />
          </RedirectIfOnboarded>
        }
      />

      {/* App routes with shell - require onboarding completion */}
      <Route
        element={
          <RequireOnboarding>
            <AppShell />
          </RequireOnboarding>
        }
      >
        <Route index element={<DailyPage />} />
        <Route path="weekly" element={<WeeklyPage />} />
        <Route path="pledge" element={<PledgePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
