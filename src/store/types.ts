import { WeekStartOption } from '../core/date';

export type Preferences = {
  weekStartsOn: WeekStartOption;
  pomodoroMinutes: number;
  breakMinutes: number;
  enforceTaskOrder: boolean;
  soundEnabled: boolean;
};

export type Task = {
  text: string;
  targetPomodoros?: number | null;
  actualPomodoros: number;
  done: boolean;
};

export type DailyEntry = {
  date: string;
  tasks: Task[];
  notes?: string;
  productivityScore?: number | null;
  productivityReflection?: string;
};

export type WeeklyPlan = {
  weekStart: string;
  mostImportant: string[];
  secondary: string[];
  additional: string[];
  commitment?: string;
};

export type Pledge = {
  signatureName: string;
  startDate: string;
  importantBecauseLines: string[];
  reward: string;
  consequence: string;
  ensureActions: string[];
  checklist: boolean[];
  createdAt: string;
  lastUpdatedAt?: string;
  text?: string;
};

export type TimerPhase = 'work' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export type TaskRef = {
  date: string;
  taskIndex: number;
};

export type TimerState = {
  status: TimerStatus;
  phase: TimerPhase;
  secondsLeft: number;
  endsAt?: number | null;
  activeTaskRef?: TaskRef;
  uiOpen: boolean;
  lastError?: string;
};

export type OnboardingState = {
  name: string;
  onboardingCompleted: boolean;
  pledgeDraft?: string;
};

export type AppData = {
  schemaVersion: number;
  preferences: Preferences;
  onboarding: OnboardingState;
  daily: Record<string, DailyEntry>;
  weekly: Record<string, WeeklyPlan>;
  pledge?: Pledge;
  timer: TimerState;
  lastImportedAt?: string;
};
